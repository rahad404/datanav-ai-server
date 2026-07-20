import { Request, Response } from "express";
import { Report } from "../models/Report.model";
import { Analysis } from "../models/Analysis.model";
import { parseDataFile } from "../services/fileParser.service";
import { analyzeDataset } from "../services/ai/dataAnalyzer.service";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";

async function runAnalysisJob(reportId: string, depth: "quick" | "deep") {
   const report = await Report.findById(reportId);
   if (!report) return;

   const analysis = await Analysis.create({ report: reportId, depth, jobStatus: "processing" });
   report.status = "processing";
   await report.save();

   try {
      const dataset = parseDataFile(report.file.path);
      const result = await analyzeDataset(dataset, depth, {
         title: report.title,
         description: report.description,
         category: report.category,
      });

      Object.assign(analysis, result, { jobStatus: "done" });
      await analysis.save();

      report.status = "done";
      report.rowCount = dataset.rowCount;
      await report.save();
   } catch (err) {
      analysis.jobStatus = "failed";
      await analysis.save();
      report.status = "failed";
      await report.save();
      console.error(`[analysis] job failed for report ${reportId}:`, err);
   }
}

export const triggerAnalysis = asyncHandler(async (req: Request, res: Response) => {
   const report = await Report.findById(req.params.id);
   if (!report) throw new ApiError("Report not found", 404);
   if (report.owner.toString() !== req.user!.userId) throw new ApiError("Not authorized", 403);

   const depth = req.body.depth === "deep" ? "deep" : "quick";

   // Fire-and-forget; client polls /analysis/status or /analysis for the result.
   runAnalysisJob(report.id, depth);

   res.status(202).json({ message: "Analysis started", status: "processing" });
});

export const regenerateAnalysis = triggerAnalysis;

export const getLatestAnalysis = asyncHandler(async (req: Request, res: Response) => {
   const analysis = await Analysis.findOne({ report: req.params.id }).sort("-createdAt");
   if (!analysis) throw new ApiError("No analysis found for this report", 404);
   res.json(analysis);
});

export const getAnalysisStatus = asyncHandler(async (req: Request, res: Response) => {
   const analysis = await Analysis.findOne({ report: req.params.id }).sort("-createdAt");
   if (!analysis) return res.json({ status: "not_started" });
   res.json({ status: analysis.jobStatus });
});

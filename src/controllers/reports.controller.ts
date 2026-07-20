import { Request, Response } from "express";
import { Report } from "../models/Report.model";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";

export const listPublicReports = asyncHandler(async (req: Request, res: Response) => {
   const { search, category, dateFrom, dateTo, sort = "-createdAt", page = "1", limit = "12" } = req.query;

   const filter: Record<string, unknown> = { isPublic: true, status: "analyzed" };
   if (category) filter.category = category;
   if (search) filter.$text = { $search: String(search) };
   if (dateFrom || dateTo) {
      filter.createdAt = {
         ...(dateFrom ? { $gte: new Date(String(dateFrom)) } : {}),
         ...(dateTo ? { $lte: new Date(String(dateTo)) } : {}),
      };
   }

   const pageNum = Number(page);
   const limitNum = Number(limit);

   const [items, total] = await Promise.all([
      Report.find(filter)
         .sort(String(sort))
         .skip((pageNum - 1) * limitNum)
         .limit(limitNum),
      Report.countDocuments(filter),
   ]);

   res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

export const getReportById = asyncHandler(async (req: Request, res: Response) => {
   const report = await Report.findById(req.params.id);
   if (!report) throw new ApiError("Report not found", 404);

   const isOwner = req.user && report.owner.toString() === req.user.userId;
   if (!report.isPublic && !isOwner) throw new ApiError("Not authorized to view this report", 403);

   if (!isOwner) {
      report.views += 1;
      await report.save();
   }
   res.json(report);
});

export const getRelatedReports = asyncHandler(async (req: Request, res: Response) => {
   const report = await Report.findById(req.params.id);
   if (!report) throw new ApiError("Report not found", 404);

   const related = await Report.find({
      _id: { $ne: report._id },
      category: report.category,
      isPublic: true,
      status: "analyzed",
   }).limit(4);

   res.json(related);
});

export const createReport = asyncHandler(async (req: Request, res: Response) => {
   const { title, description, category, isPublic } = req.body;
   if (!req.file) throw new ApiError("A data file is required", 400);

   const report = await Report.create({
      title,
      description,
      category,
      isPublic: isPublic === "true" || isPublic === true,
      owner: req.user!.userId,
      status: "uploaded",
      file: {
         originalName: req.file.originalname,
         storedPath: req.file.path,
         mimeType: req.file.mimetype,
         sizeBytes: req.file.size,
      },
   });

   res.status(201).json(report);
});

export const listMyReports = asyncHandler(async (req: Request, res: Response) => {
   const reports = await Report.find({ owner: req.user!.userId }).sort("-createdAt");
   res.json(reports);
});

export const updateReport = asyncHandler(async (req: Request, res: Response) => {
   const report = await Report.findById(req.params.id);
   if (!report) throw new ApiError("Report not found", 404);
   if (report.owner.toString() !== req.user!.userId && req.user!.role !== "admin") {
      throw new ApiError("Not authorized", 403);
   }

   const { title, description, isPublic, category } = req.body;
   Object.assign(report, {
      ...(title && { title }),
      ...(description && { description }),
      ...(category && { category }),
      ...(isPublic !== undefined && { isPublic }),
   });

   await report.save();
   res.json(report);
});

export const deleteReport = asyncHandler(async (req: Request, res: Response) => {
   const report = await Report.findById(req.params.id);
   if (!report) throw new ApiError("Report not found", 404);
   if (report.owner.toString() !== req.user!.userId && req.user!.role !== "admin") {
      throw new ApiError("Not authorized", 403);
   }
   await report.deleteOne();
   res.json({ message: "Report deleted" });
});

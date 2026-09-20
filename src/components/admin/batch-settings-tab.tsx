"use client";

import { useState } from "react";
import { Add, Edit, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { updateBatchDetailsAction } from "@/lib/actions/batch";
import type { BatchDetail } from "@/types";

export function BatchSettingsTab({ batch }: { batch: BatchDetail }) {
  const details = (batch as any).details || {};
  const curriculumObj =
    details.curriculum &&
    typeof details.curriculum === "object" &&
    !Array.isArray(details.curriculum)
      ? details.curriculum
      : {};

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Basic Info
  const [name, setName] = useState(batch.name || "");
  const [slug, setSlug] = useState(batch.slug || "");
  const [subtitle, setSubtitle] = useState((batch as any).subtitle || "");
  const [hscBatch, setHscBatch] = useState((batch as any).hscBatch || "HSC 26");
  const [price, setPrice] = useState((batch as any).price || 0);
  const [originalPrice, setOriginalPrice] = useState<number | string>(
    (batch as any).originalPrice || "",
  );
  const [image, setImage] = useState((batch as any).image || "");
  const [badge, setBadge] = useState((batch as any).badge || "স্পেশাল ব্যাচ");
  const [description, setDescription] = useState(batch.description || "");
  const [isPublished, setIsPublished] = useState(
    (batch as any).isPublished ?? true,
  );
  const [isActive, setIsActive] = useState(batch.isActive ?? true);

  // Course Duration, Rating & Rating Count
  const [duration, setDuration] = useState(
    curriculumObj.duration || (details as any).duration || "১ বছর কমপ্লিট এক্সেস",
  );
  const [rating, setRating] = useState(
    curriculumObj.rating || (details as any).rating || "5.0",
  );
  const [ratingCount, setRatingCount] = useState(
    curriculumObj.ratingCount || (details as any).ratingCount || "50+",
  );

  // Details
  const [routinePdfUrl, setRoutinePdfUrl] = useState(
    details.routinePdfUrl || details.routineUrl || curriculumObj.routinePdfUrl || "",
  );
  const [telegramGroupUrl, setTelegramGroupUrl] = useState(
    details.telegramGroupUrl || curriculumObj.telegramGroupUrl || "",
  );

  // Dynamic Lists
  const [features, setFeatures] = useState<string[]>(
    Array.isArray(details.features) ? details.features : [],
  );
  const [newFeature, setNewFeature] = useState("");

  const [instructors, setInstructors] = useState<
    Array<{ name: string; role: string; institution: string }>
  >(
    Array.isArray(details.instructors)
      ? details.instructors
      : Array.isArray(details.mentorIds)
        ? details.mentorIds
        : [],
  );
  const [newInstructorName, setNewInstructorName] = useState("");
  const [newInstructorRole, setNewInstructorRole] = useState("");
  const [newInstructorInst, setNewInstructorInst] = useState("");

  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
    Array.isArray(details.faqs) ? details.faqs : [],
  );
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");

  // Handlers for Features
  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  // Handlers for Instructors
  const addInstructor = () => {
    if (newInstructorName.trim()) {
      setInstructors([
        ...instructors,
        {
          name: newInstructorName.trim(),
          role: newInstructorRole.trim() || "Instructor",
          institution: newInstructorInst.trim() || "BUET / Medical / DU",
        },
      ]);
      setNewInstructorName("");
      setNewInstructorRole("");
      setNewInstructorInst("");
    }
  };

  const removeInstructor = (idx: number) => {
    setInstructors(instructors.filter((_, i) => i !== idx));
  };

  // Handlers for FAQs
  const addFaq = () => {
    if (newFaqQ.trim() && newFaqA.trim()) {
      setFaqs([
        ...faqs,
        { question: newFaqQ.trim(), answer: newFaqA.trim() },
      ]);
      setNewFaqQ("");
      setNewFaqA("");
    }
  };

  const removeFaq = (idx: number) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await updateBatchDetailsAction(batch.id, {
      name,
      slug,
      subtitle: subtitle || null,
      hscBatch,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      image,
      badge: badge || null,
      description,
      isPublished,
      isActive,
      duration: duration || null,
      rating: rating || null,
      ratingCount: ratingCount || null,
      features,
      instructors,
      faqs,
      routinePdfUrl: routinePdfUrl || null,
      routineUrl: routinePdfUrl || null,
      telegramGroupUrl: telegramGroupUrl || null,
    });

    setLoading(false);
    if (res.success) {
      setSuccessMsg("কোর্সের বিস্তারিত তথ্য সফলভাবে সংরক্ষিত হয়েছে!");
    } else {
      setErrorMsg(res.error || "সংরক্ষণ করতে সমস্যা হয়েছে");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-sm font-semibold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Edit className="size-5 text-primary" />
            কোর্স সেটিংস ও ল্যান্ডিং পেজ বিস্তারিত
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            কোর্সের ল্যান্ডিং পেজে প্রদর্শিত সকল বিবরণ, ফিচার, মেন্টর ও প্রায়শ জিজ্ঞাসিত প্রশ্ন কনফিগার করুন।
          </p>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-full shadow-xs px-6 font-bold cursor-pointer"
        >
          {loading ? <Spinner className="size-4 mr-2" /> : null}
          সংরক্ষণ করুন
        </Button>
      </div>

      {/* Basic Settings */}
      <div className="bg-card border rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
          প্রাথমিক তথ্য (Basic Info)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">কোর্সের নাম *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">স্লাগ (URL Slug) *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subtitle">সাবটাইটেল / ট্যাগলাইন</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. পদার্থবিজ্ঞান ও রসায়ন সম্পূর্ণ প্রস্তুতি"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="hscBatch">HSC Batch Tag / ক্যাটাগরি</Label>
              <span className="text-[11px] text-muted-foreground">ক্লিক করে সিলেক্ট করুন</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              {(["HSC 26", "HSC 27", "Admission"] as const).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setHscBatch(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    hscBatch === tag
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <Input
              id="hscBatch"
              value={hscBatch}
              onChange={(e) => setHscBatch(e.target.value)}
              placeholder="e.g. HSC 26 / HSC 27 / Admission"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">বর্তমান মূল্য (Price ৳) *</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="originalPrice">আগের মূল্য (Original Price ৳)</Label>
            <Input
              id="originalPrice"
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="e.g. 2000"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="badge">ব্যাজ (Badge Text)</Label>
            <Input
              id="badge"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="স্পেশাল ব্যাচ / প্রিমিয়াম কোর্স"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image">কভার ইমেজ লিঙ্ক (Image URL) *</Label>
            <Input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">কোর্সের সংক্ষিপ্ত বিবরণ *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="rounded-xl min-h-[90px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="duration">কোর্সের মেয়াদ / ডিউরেশন</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. ১ বছর কমপ্লিট এক্সেস"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rating">স্টার রেটিং (Rating)</Label>
            <Input
              id="rating"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="e.g. 5.0"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ratingCount">শিক্ষার্থী / রিভিউ সংখ্যা</Label>
            <Input
              id="ratingCount"
              value={ratingCount}
              onChange={(e) => setRatingCount(e.target.value)}
              placeholder="e.g. 50+ বা ১০০+ শিক্ষার্থী"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="routinePdfUrl">রুটিন পিডিএফ লিঙ্ক (PDF URL)</Label>
            <Input
              id="routinePdfUrl"
              value={routinePdfUrl}
              onChange={(e) => setRoutinePdfUrl(e.target.value)}
              placeholder="https://.../routine.pdf"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telegramGroupUrl">টেলিগ্রাম সাপোর্ট গ্রুপ লিঙ্ক</Label>
            <Input
              id="telegramGroupUrl"
              value={telegramGroupUrl}
              onChange={(e) => setTelegramGroupUrl(e.target.value)}
              placeholder="https://t.me/..."
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="size-4"
            />
            <span className="text-sm font-medium">
              পাবলিক ল্যান্ডিং পেজে দেখাবে (Published)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4"
            />
            <span className="text-sm font-medium">কোর্সটি সক্রিয় (Active)</span>
          </label>
        </div>
      </div>

      {/* Features List */}
      <div className="bg-card border rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
          কোর্স ফিচারসমূহ (Features)
        </h3>

        <div className="space-y-2">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <span className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span>{feat}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFeature(idx)}
                className="size-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {features.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">
              এখনও কোনো ফিচার যুক্ত করা হয়নি।
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Input
            placeholder="যেমন: ৫০+ লাইভ ক্লাস ও রেকর্ডেড ব্যাকআপ"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature();
              }
            }}
            className="rounded-xl"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addFeature}
            className="rounded-xl shrink-0"
          >
            <Add className="size-4 mr-1" /> যোগ করুন
          </Button>
        </div>
      </div>

      {/* Instructors */}
      <div className="bg-card border rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
          মেন্টর / শিক্ষকবৃন্দ (Instructors)
        </h3>

        <div className="space-y-2">
          {instructors.map((ins, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60"
            >
              <div>
                <div className="text-sm font-bold text-foreground">
                  {ins.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {ins.role} • {ins.institution}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeInstructor(idx)}
                className="size-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {instructors.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">
              এখনও কোনো মেন্টর যুক্ত করা হয়নি।
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <Input
            placeholder="মেন্টরের নাম"
            value={newInstructorName}
            onChange={(e) => setNewInstructorName(e.target.value)}
            className="rounded-xl"
          />
          <Input
            placeholder="পদবি (e.g. Physics Lead)"
            value={newInstructorRole}
            onChange={(e) => setNewInstructorRole(e.target.value)}
            className="rounded-xl"
          />
          <Input
            placeholder="প্রতিষ্ঠান (e.g. BUET EEE)"
            value={newInstructorInst}
            onChange={(e) => setNewInstructorInst(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={addInstructor}
          className="rounded-xl w-full sm:w-auto mt-2"
        >
          <Add className="size-4 mr-1" /> মেন্টর যুক্ত করুন
        </Button>
      </div>

      {/* FAQs */}
      <div className="bg-card border rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
          সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQs)
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-start justify-between gap-4"
            >
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="font-bold text-foreground">
                  প্রশ্ন: {faq.question}
                </div>
                <div className="text-muted-foreground">
                  উত্তর: {faq.answer}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFaq(idx)}
                className="size-8 p-0 text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {faqs.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">
              এখনও কোনো প্রশ্ন যুক্ত করা হয়নি।
            </p>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <Input
            placeholder="প্রশ্ন লিখুন (e.g. ক্লাসগুলো কি রেকর্ডেড থাকবে?)"
            value={newFaqQ}
            onChange={(e) => setNewFaqQ(e.target.value)}
            className="rounded-xl"
          />
          <Textarea
            placeholder="উত্তর লিখুন (e.g. হ্যাঁ, সব ক্লাসের রেকর্ডেড ভিডিও এক্সাম পর্যন্ত দেখা যাবে।)"
            value={newFaqA}
            onChange={(e) => setNewFaqA(e.target.value)}
            className="rounded-xl min-h-[70px]"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addFaq}
            className="rounded-xl mt-2"
          >
            <Add className="size-4 mr-1" /> FAQ যুক্ত করুন
          </Button>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="rounded-xl font-extrabold px-8 cursor-pointer"
        >
          {loading ? <Spinner className="size-4 mr-2" /> : null}
          কোর্সের সকল তথ্য সংরক্ষণ করুন
        </Button>
      </div>
    </form>
  );
}

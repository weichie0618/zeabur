"use client";

import React, { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { RadioGroup, type RadioGroupItem } from "@/app/components/ui/Radio";
import { Checkbox } from "@/app/components/ui/Checkbox";
import { FranchiseFormData } from "@/types";

interface FranchiseFormProps {
  onSubmit?: (data: FranchiseFormData) => Promise<void>;
  onSuccess?: () => void;
}

/**
 * FranchiseForm 加盟表單組件
 * 用於收集加盟申請者的相關資訊
 */
export function FranchiseForm({
  onSubmit,
  onSuccess,
}: FranchiseFormProps) {
  const [formData, setFormData] = useState<FranchiseFormData>({
    name: "",
    email: "",
    phone: "",
    budgetRange: "",
    location: "",
    introduction: "",
    experience: "",
  });

  const [errors, setErrors] = useState<Partial<FranchiseFormData>>({});
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const budgetOptions: RadioGroupItem[] = [
    { id: "budget-1", label: "NT$500,000 - NT$1,000,000", value: "500k-1m" },
    { id: "budget-2", label: "NT$1,000,000 - NT$3,000,000", value: "1m-3m" },
    { id: "budget-3", label: "NT$3,000,000 - NT$5,000,000", value: "3m-5m" },
    { id: "budget-4", label: "NT$5,000,000 以上", value: "5m+" },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<FranchiseFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "姓名為必填";
    }

    if (!formData.email.trim()) {
      newErrors.email = "電子郵件為必填";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "請輸入有效的電子郵件";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "電話為必填";
    }

    if (!formData.budgetRange) {
      newErrors.budgetRange = "請選擇預算範圍";
    }

    if (!agreedTerms) {
      setErrors((prev) => ({
        ...prev,
        introduction: "請同意加盟條款和隱私政策",
      }));
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FranchiseFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        const response = await fetch("/api/franchise", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("提交失敗");
        }
      }

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        budgetRange: "",
        location: "",
        introduction: "",
        experience: "",
      });
      setAgreedTerms(false);

      onSuccess?.();

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error("表單提交錯誤:", error);
      alert("提交失敗，請稍後重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {submitted && (
        <div className="p-4 bg-success/10 border border-success text-success rounded-lg">
          ✓ 感謝您的加盟申請！我們會盡快與您聯繫。
        </div>
      )}

      {/* 基本資訊 */}
      <div>
        <h3 className="text-lg font-bold text-sunny-dark mb-6">基本資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 姓名 */}
          <Input
            label="姓名"
            name="name"
            placeholder="請輸入您的全名"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          {/* 電話 */}
          <Input
            label="電話"
            name="phone"
            type="tel"
            placeholder="請輸入電話號碼"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required
          />

          {/* 電子郵件 */}
          <Input
            label="電子郵件"
            name="email"
            type="email"
            placeholder="請輸入電子郵件"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          {/* 預計開店地點 */}
          <Input
            label="預計開店地點"
            name="location"
            placeholder="例如：台北市信義區"
            value={formData.location}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* 預算資訊 */}
      <div>
        <h3 className="text-lg font-bold text-sunny-dark mb-6">預算資訊</h3>
        <RadioGroup
          label="預算範圍"
          name="budgetRange"
          items={budgetOptions}
          value={formData.budgetRange}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, budgetRange: value }))
          }
          error={errors.budgetRange}
        />
      </div>

      {/* 背景資訊 */}
      <div>
        <h3 className="text-lg font-bold text-sunny-dark mb-6">背景資訊</h3>

        {/* 自我介紹 */}
        <div className="mb-6">
          <Textarea
            label="自我介紹"
            name="introduction"
            placeholder="請簡單介紹您自己、創業背景、為什麼想加盟晴朗家烘焙等..."
            value={formData.introduction}
            onChange={handleChange}
            rows={5}
            fullWidth
          />
        </div>

        {/* 從業經驗 */}
        <Textarea
          label="從業經驗"
          name="experience"
          placeholder="如有烘焙、餐飲或零售業經驗，請詳細說明..."
          value={formData.experience}
          onChange={handleChange}
          rows={4}
          fullWidth
        />
      </div>

      {/* 同意條款 */}
      <div className="border-t border-sunny-border pt-6">
        <Checkbox
          label="我同意晴朗家烘焙加盟條款和隱私政策"
          checked={agreedTerms}
          onChange={(e) => setAgreedTerms(e.currentTarget.checked)}
          required
        />
        {!agreedTerms && errors.introduction && (
          <p className="mt-2 text-sm text-error-color">{errors.introduction}</p>
        )}
      </div>

      {/* 提交按鈕 */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={loading || !agreedTerms}
      >
        {loading ? "提交中..." : "提交加盟申請"}
      </Button>

      {/* 提示文本 */}
      <p className="text-xs text-sunny-light-gray text-center">
        我們會在收到您的申請後的 2-3 個工作天內與您聯繫。
      </p>
    </form>
  );
}

export default FranchiseForm;


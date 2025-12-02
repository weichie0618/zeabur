"use client";

import React, { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Select, type SelectOption } from "@/app/components/ui/Select";
import { InquiryFormData } from "@/types";

interface InquiryFormProps {
  onSubmit?: (data: InquiryFormData) => Promise<void>;
  onSuccess?: () => void;
  inquiryType?: "oembaking" | "corporate-procurement";
}

/**
 * InquiryForm 詢價表單組件
 * 用於代工烘培和企業採購的詢價表單
 */
export function InquiryForm({
  onSubmit,
  onSuccess,
  inquiryType = "oembaking",
}: InquiryFormProps) {
  const [formData, setFormData] = useState<InquiryFormData>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    inquiryType,
    quantity: "",
    budget: "",
    remarks: "",
  });

  const [errors, setErrors] = useState<Partial<InquiryFormData>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inquiryTypeOptions: SelectOption[] = [
    { label: "請選擇詢價類型", value: "" },
    { label: "代工烘培", value: "oembaking" },
    { label: "企業採購", value: "corporate-procurement" },
  ];

  const budgetOptions: SelectOption[] = [
    { label: "請選擇預算範圍", value: "" },
    { label: "NT$10,000 - NT$50,000", value: "10k-50k" },
    { label: "NT$50,000 - NT$100,000", value: "50k-100k" },
    { label: "NT$100,000 - NT$500,000", value: "100k-500k" },
    { label: "NT$500,000 以上", value: "500k+" },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<InquiryFormData> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "公司名稱為必填";
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = "聯絡人名稱為必填";
    }

    if (!formData.email.trim()) {
      newErrors.email = "電子郵件為必填";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "請輸入有效的電子郵件";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "電話為必填";
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

    if (errors[name as keyof InquiryFormData]) {
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
        const response = await fetch("/api/inquiry", {
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
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        inquiryType,
        quantity: "",
        budget: "",
        remarks: "",
      });

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitted && (
        <div className="p-4 bg-success/10 border border-success text-success rounded-lg">
          ✓ 感謝您的詢價！我們會盡快與您聯繫。
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 公司名稱 */}
        <Input
          label="公司名稱"
          name="companyName"
          placeholder="請輸入公司名稱"
          value={formData.companyName}
          onChange={handleChange}
          error={errors.companyName}
          required
        />

        {/* 聯絡人名稱 */}
        <Input
          label="聯絡人名稱"
          name="contactName"
          placeholder="請輸入聯絡人名稱"
          value={formData.contactName}
          onChange={handleChange}
          error={errors.contactName}
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
      </div>

      {/* 詢價類型 */}
      <Select
        label="詢價類型"
        name="inquiryType"
        options={inquiryTypeOptions}
        value={formData.inquiryType}
        onChange={handleChange}
        fullWidth
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 預估數量 */}
        <Input
          label="預估數量"
          name="quantity"
          placeholder="例如：1000 個"
          value={formData.quantity}
          onChange={handleChange}
        />

        {/* 預算範圍 */}
        <Select
          label="預算範圍"
          name="budget"
          options={budgetOptions}
          value={formData.budget}
          onChange={handleChange}
        />
      </div>

      {/* 備註 */}
      <Textarea
        label="備註或其他需求"
        name="remarks"
        placeholder="請說明您的特殊需求或其他補充資訊..."
        value={formData.remarks}
        onChange={handleChange}
        rows={4}
        fullWidth
      />

      {/* 提交按鈕 */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={loading}
      >
        {loading ? "提交中..." : "提交詢價"}
      </Button>
    </form>
  );
}

export default InquiryForm;


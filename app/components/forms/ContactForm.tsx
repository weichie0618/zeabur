"use client";

import React, { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { ContactFormData } from "@/types";

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => Promise<void>;
  onSuccess?: () => void;
}

/**
 * ContactForm 聯絡表單組件
 *
 * @example
 * ```tsx
 * <ContactForm
 *   onSubmit={async (data) => {
 *     await fetch('/api/contact', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *   }}
 *   onSuccess={() => alert('感謝您的訊息')}
 * />
 * ```
 */
export function ContactForm({
  onSubmit,
  onSuccess,
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "姓名為必填";
    }

    if (!formData.email.trim()) {
      newErrors.email = "電子郵件為必填";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "請輸入有效的電子郵件";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "主旨為必填";
    }

    if (!formData.message.trim()) {
      newErrors.message = "訊息為必填";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 清除該欄位的錯誤
    if (errors[name as keyof ContactFormData]) {
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
        // 預設 API 調用
        const response = await fetch("/api/contact", {
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
        subject: "",
        message: "",
      });

      onSuccess?.();

      // 3 秒後隱藏成功消息
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
      {/* 成功消息 */}
      {submitted && (
        <div className="p-4 bg-success/10 border border-success text-success rounded-lg">
          ✓ 感謝您的訊息！我們會盡快回覆您。
        </div>
      )}

      {/* 姓名 */}
      <Input
        label="姓名"
        name="name"
        placeholder="請輸入您的姓名"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
        fullWidth
      />

      {/* 電子郵件 */}
      <Input
        label="電子郵件"
        name="email"
        type="email"
        placeholder="請輸入您的電子郵件"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
        fullWidth
      />

      {/* 電話 */}
      <Input
        label="電話"
        name="phone"
        type="tel"
        placeholder="請輸入您的電話號碼（選填）"
        value={formData.phone}
        onChange={handleChange}
        fullWidth
      />

      {/* 主旨 */}
      <Input
        label="主旨"
        name="subject"
        placeholder="請輸入訊息主旨"
        value={formData.subject}
        onChange={handleChange}
        error={errors.subject}
        required
        fullWidth
      />

      {/* 訊息 */}
      <Textarea
        label="訊息"
        name="message"
        placeholder="請輸入您的訊息..."
        value={formData.message}
        onChange={handleChange}
        error={errors.message}
        rows={5}
        required
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
        {loading ? "發送中..." : "發送訊息"}
      </Button>
    </form>
  );
}

export default ContactForm;


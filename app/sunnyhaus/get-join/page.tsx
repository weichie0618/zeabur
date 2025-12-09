"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { ChevronDown, CheckCircle2, Phone, Mail, MapPin, TrendingUp, Users, Award, Shield, MessageCircle, Clock, Calendar, AlertCircle, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/app/components/layout/Footer";

interface FormData {
  name: string;
  phone: string;
  lineId: string;
  email: string;
  age: string;
  subject: string;
  city: string;
  budget: string;
  contactTime: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

const benefits = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    number: "01",
    title: "完整培訓系統",
    desc: "從開店準備到營運管理，提供全方位的專業培訓，讓您快速上手",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    number: "02",
    title: "品牌支援",
    desc: "成熟的品牌形象與行銷資源，助您快速建立市場知名度",
  },
  {
    icon: <Users className="w-6 h-6" />,
    number: "03",
    title: "穩定供應鏈",
    desc: "優質產品供應與庫存管理系統，確保營運順暢無虞",
  },
  {
    icon: <Award className="w-6 h-6" />,
    number: "04",
    title: "持續協助",
    desc: "專屬顧問定期拜訪，提供持續的經營指導與支援服務",
  },
];

const faqs = [
  {
    q: "加盟需要烘焙經驗嗎？",
    a: "不需要！我們會提供完整的培訓和支援，包括烘焙技術、營運管理等。無論您是否有相關經驗，我們都會協助您成功開店。我們的培訓課程涵蓋從基礎到進階的所有內容，確保您能夠順利經營。",
  },
  {
    q: "加盟後可以改變產品嗎？",
    a: "可以在公司指導下進行，主要產品需遵循公司標準以維持品牌一致性。我們鼓勵在地化調整，但需要經過總部審核。我們會根據當地市場需求，協助您選擇適合的產品組合。",
  },
  {
    q: "加盟期間是多久？",
    a: "一般加盟期為 3 年，期滿後可續約或重新評估。我們重視長期合作關係，會優先考慮續約申請。續約時會根據經營狀況提供優惠條件。",
  },
  {
    q: "如果經營不善怎麼辦？",
    a: "公司會提供持續的營運協助，包括行銷、管理、技術等支援。我們有專門的營運顧問團隊，會協助您改善經營狀況。我們會定期分析營運數據，提供改善建議。",
  },
  {
    q: "投資金額大約需要多少？",
    a: "總投資金額約為 NT$300 萬至 500 萬，包括加盟金、裝潢、設備、初期營運資金等。實際金額會依地點和店面大小而有所差異。我們提供詳細的投資明細表，讓您清楚了解每一項費用。",
  },
  {
    q: "開店後多久可以開始獲利？",
    a: "一般來說，在正常營運情況下，約 6-12 個月可以達到損益平衡。實際獲利時間會受到地點、市場環境、經營策略等因素影響。我們會提供財務規劃協助，幫助您設定合理的獲利目標。",
  },
];

export default function FranchisePage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    lineId: "",
    email: "",
    age: "",
    subject: "",
    city: "",
    budget: "",
    contactTime: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '請輸入您的姓名';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '姓名至少需要2個字元';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '請輸入您的聯絡電話';
    } else if (!/^[0-9\-\s()]+$/.test(formData.phone.trim())) {
      newErrors.phone = '請輸入有效的電話號碼';
    }

    if (!formData.email.trim()) {
      newErrors.email = '請輸入您的電子郵件';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = '請輸入有效的電子郵件格式';
    }

    if (!formData.subject) {
      newErrors.subject = '請選擇加盟品牌';
    }

    if (!formData.city.trim()) {
      newErrors.city = '請輸入預計開店城市';
    }

    if (!formData.budget) {
      newErrors.budget = '請選擇創業準備金';
    }

    if (!formData.contactTime) {
      newErrors.contactTime = '請選擇方便連絡時段';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // 清除該欄位的錯誤訊息
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitStatus('loading');

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "franchise",
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '提交失敗');
      }

      setSubmitStatus('success');
      setSubmitMessage('感謝您的加盟諮詢！我們的加盟顧問會在24小時內與您聯繫。');
      
      // 重置表單
      setFormData({
        name: "",
        phone: "",
        lineId: "",
        email: "",
        age: "",
        subject: "",
        city: "",
        budget: "",
        contactTime: "",
        message: "",
      });

      // 5秒後清除成功訊息
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitMessage('');
      }, 5000);
    } catch (error) {
      console.error("表單提交錯誤:", error);
      setSubmitStatus('error');
      setSubmitMessage('提交失敗，請稍後再試。如有急需，請直接撥打加盟專線：0800-872-642');
      
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitMessage('');
      }, 5000);
    }
  };

  const inputClassName = (fieldName: string) => 
    `w-full bg-transparent border-b-2 transition-all duration-200 focus:outline-none py-2 sm:py-3 text-foreground placeholder:text-muted-foreground/50 text-sm sm:text-base ${
      errors[fieldName] 
        ? 'border-red-500 focus:border-red-500' 
        : 'border-border/60 focus:border-sunny-orange'
    }`;

  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden">
        {/* Hero Section - 響應式優化 */}
        <section className="relative pt-20 sm:pt-24 md:pt-48 pb-12 sm:pb-16 md:pb-24 px-4 sm:px-6 bg-gradient-to-br from-background via-secondary/30 to-secondary/50 overflow-hidden">
          {/* 裝飾性背景元素 */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 right-10 w-72 h-72 bg-sunny-orange rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-sunny-gold rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="max-w-4xl space-y-6 sm:space-y-8">
              <p className="text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] text-sunny-orange/80 uppercase font-semibold">
                Franchise Application
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-[1.1] sm:leading-tight">
                成為
                <br className="hidden sm:block" />
                <span className="font-semibold text-sunny-orange block sm:inline"> 晴朗家 </span>
                的一份子
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                加入我們的烘焙事業，共同傳遞溫暖與美味。我們提供完整的支援系統，讓您的創業之路更加順遂。
              </p>
              
             
            </div>
          </div>
        </section>

        {/* Benefits Section - 響應式網格 */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 border-t border-border/50 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
              {benefits.map((item, index) => (
                <div
                  key={item.number}
                  className="group p-6 sm:p-8 rounded-lg hover:bg-secondary/50 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 sm:p-3 bg-sunny-orange/10 rounded-lg text-sunny-orange group-hover:bg-sunny-orange group-hover:text-white transition-all duration-300">
                      {item.icon}
                    </div>
                    <span className="text-xs sm:text-sm text-sunny-orange/60 font-bold tracking-wider mt-2">
                      {item.number}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3 group-hover:text-sunny-orange transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section - 響應式表單 */}
        <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-secondary/40 to-secondary/20">
          <div className="container mx-auto max-w-3xl">
            <div className="mb-8 sm:mb-12 md:mb-16 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-3 sm:mb-4">
                填寫申請表單
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                我們將在 24 小時內與您聯繫
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-sm" noValidate>
              {/* 姓名和電話 - 響應式網格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm sm:text-base text-foreground font-medium block">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClassName('name')}
                    placeholder="請輸入您的姓名"
                    required
                    disabled={submitStatus === 'loading'}
                  />
                  <AnimatePresence>
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-red-500 mt-1 flex items-center"
                      >
                        <AlertCircle size={14} className="mr-1" />
                        {errors.name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm sm:text-base text-foreground font-medium block">
                    聯絡電話 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClassName('phone')}
                    placeholder="請輸入您的聯絡電話"
                    required
                    disabled={submitStatus === 'loading'}
                  />
                  <AnimatePresence>
                    {errors.phone && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-red-500 mt-1 flex items-center"
                      >
                        <AlertCircle size={14} className="mr-1" />
                        {errors.phone}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* LINE ID 和電子郵件 - 響應式網格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <label htmlFor="lineId" className="text-sm sm:text-base text-foreground font-medium block flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    LINE ID
                  </label>
                  <input
                    id="lineId"
                    name="lineId"
                    type="text"
                    value={formData.lineId}
                    onChange={handleChange}
                    className={inputClassName('lineId')}
                    placeholder="ck224wre"
                    disabled={submitStatus === 'loading'}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm sm:text-base text-foreground font-medium block">
                    電子郵件 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClassName('email')}
                    placeholder="example@email.com"
                    required
                    disabled={submitStatus === 'loading'}
                  />
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-red-500 mt-1 flex items-center"
                      >
                        <AlertCircle size={14} className="mr-1" />
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 品牌和城市 - 響應式網格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm sm:text-base text-foreground font-medium block">
                    有興趣的品牌 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className={inputClassName('subject')}
                    disabled={submitStatus === 'loading'}
                  >
                    <option value="">請選擇品牌</option>
                    <option value="城市漢堡">城市漢堡</option>
                    <option value="晴朗家烘焙">晴朗家烘焙</option>
                    <option value="20呎智能貨櫃店 - AI 無人商店">20呎智能貨櫃店 - AI 無人商店</option>
                    <option value="蒸好饌">蒸好饌</option>
                  </select>
                  <AnimatePresence>
                    {errors.subject && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-red-500 mt-1 flex items-center"
                      >
                        <AlertCircle size={14} className="mr-1" />
                        {errors.subject}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm sm:text-base text-foreground font-medium block flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    預計開店城市 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className={inputClassName('city')}
                    placeholder="例如：台北市"
                    disabled={submitStatus === 'loading'}
                  />
                  <AnimatePresence>
                    {errors.city && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-red-500 mt-1 flex items-center"
                      >
                        <AlertCircle size={14} className="mr-1" />
                        {errors.city}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 年齡和連絡時段 - 響應式網格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <label htmlFor="age" className="text-sm sm:text-base text-foreground font-medium block flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    您的年齡
                  </label>
                  <select
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className={inputClassName('age')}
                    disabled={submitStatus === 'loading'}
                  >
                    <option value="">請選擇</option>
                    <option value="26以下">26歲以下</option>
                    <option value="27-35">27-35歲</option>
                    <option value="36-45">36-45歲</option>
                    <option value="46以上">46歲以上</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="contactTime" className="text-sm sm:text-base text-foreground font-medium block flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    方便連絡時段 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="contactTime"
                    name="contactTime"
                    required
                    value={formData.contactTime}
                    onChange={handleChange}
                    className={inputClassName('contactTime')}
                    disabled={submitStatus === 'loading'}
                  >
                    <option value="">請選擇時段</option>
                    <option value="平日 09:00-12:00">平日 09:00-12:00</option>
                    <option value="平日 12:00-15:00">平日 12:00-15:00</option>
                    <option value="平日 15:00-18:00">平日 15:00-18:00</option>
                    <option value="平日 18:00-21:00">平日 18:00-21:00</option>
                    <option value="週末 09:00-12:00">週末 09:00-12:00</option>
                    <option value="週末 12:00-18:00">週末 12:00-18:00</option>
                    <option value="皆可">皆可</option>
                  </select>
                  <AnimatePresence>
                    {errors.contactTime && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-red-500 mt-1 flex items-center"
                      >
                        <AlertCircle size={14} className="mr-1" />
                        {errors.contactTime}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 創業準備金 - 響應式網格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <label htmlFor="budget" className="text-sm sm:text-base text-foreground font-medium block">
                    創業準備金 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    required
                    value={formData.budget}
                    onChange={handleChange}
                    className={inputClassName('budget')}
                    disabled={submitStatus === 'loading'}
                  >
                    <option value="">請選擇準備金範圍</option>
                    <option value="25~60萬">25~60萬</option>
                    <option value="61~100萬">61~100萬</option>
                    <option value="100萬以上">100萬以上</option>
                  </select>
                  <AnimatePresence>
                    {errors.budget && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-red-500 mt-1 flex items-center"
                      >
                        <AlertCircle size={14} className="mr-1" />
                        {errors.budget}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 其他說明 */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm sm:text-base text-foreground font-medium block">
                  其他補充說明
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className={`${inputClassName('message')} resize-none`}
                  placeholder="請簡述您的加盟意向、理想開店地點、時程規劃等..."
                  disabled={submitStatus === 'loading'}
                />
                <AnimatePresence>
                  {errors.message && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-red-500 mt-1 flex items-center"
                    >
                      <AlertCircle size={14} className="mr-1" />
                      {errors.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* 提交狀態訊息 */}
              <AnimatePresence mode="wait">
                {submitStatus !== 'idle' && submitStatus !== 'loading' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-4 rounded-lg flex items-center ${
                      submitStatus === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}
                  >
                    {submitStatus === 'success' ? (
                      <CheckCircle2 size={20} className="mr-2 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                    )}
                    <p className="text-sm font-medium">{submitMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 提交按鈕 - 響應式 */}
              <motion.button
                type="submit"
                disabled={submitStatus === 'loading'}
                whileHover={{ scale: submitStatus === 'loading' ? 1 : 1.02 }}
                whileTap={{ scale: submitStatus === 'loading' ? 1 : 0.98 }}
                className="w-full bg-sunny-orange text-white py-3 sm:py-4 rounded-lg hover:bg-sunny-orange/90 active:bg-sunny-orange/95 transition-all font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm sm:text-base flex items-center justify-center space-x-2"
              >
                {submitStatus === 'loading' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>提交中...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>提交加盟諮詢</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </section>

       

      
      </main>
      <Footer />
    </>
  );
}

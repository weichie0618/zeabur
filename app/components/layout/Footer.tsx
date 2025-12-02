import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";
import { navConfig } from "@/app/components/sections/Navbar";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-sunny-dark text-white mt-20">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold text-sunny-gold mb-4">晴朗家烘焙</h3>
            <p className="text-gray-300 mb-4 line-clamp-3">
              讓晴朗家烘焙成為每個早晨幸福的開始。我們以熱情與創新打造每一款產品，為您的生活增添幸福與美好。
            </p>
            {/* Social Links */}
            <div className="flex gap-4 mt-4">
              <a
                href="https://www.facebook.com/SunnyHausBakery/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sunny-gold transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={24} />
              </a>
              <a
                href="https://www.instagram.com/SunnyHausBakery/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sunny-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-sunny-gold mb-4">快速連結</h4>
            <ul className="space-y-2">
              {navConfig.footer?.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-300 hover:text-sunny-gold transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-sunny-gold mb-4">聯絡資訊</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Phone size={20} className="text-sunny-gold flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <a
                    href="tel:+886212345678"
                    className="text-gray-300 hover:text-sunny-gold transition-colors"
                  >
                    02-1234-5678
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail size={20} className="text-sunny-gold flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:contact@sunnyhausbakery.com.tw"
                  className="text-gray-300 hover:text-sunny-gold transition-colors"
                >
                  contact@sunnyhausbakery.com.tw
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={20} className="text-sunny-gold flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">
                  台灣 台北市信義區 01234 號
                </span>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="text-lg font-semibold text-sunny-gold mb-4">營業時間</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <span className="font-semibold">週一至週五:</span>
                <br />
                06:00 - 21:00
              </li>
              <li>
                <span className="font-semibold">週六:</span>
                <br />
                07:00 - 22:00
              </li>
              <li>
                <span className="font-semibold">週日:</span>
                <br />
                08:00 - 20:00
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} 晴朗家烘焙。保留所有權利。
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                href="#"
                className="text-gray-400 hover:text-sunny-gold transition-colors"
              >
                隱私政策
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-sunny-gold transition-colors"
              >
                使用條款
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-sunny-gold transition-colors"
              >
                網站地圖
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;


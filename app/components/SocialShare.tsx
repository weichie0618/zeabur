'use client';

import { useState } from 'react';

interface SocialShareProps {
  title: string;
  url: string;
}

export default function SocialShare({ title, url }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer.php?u=${shareUrl}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M20,10.1c0-5.5-4.5-10-10-10S0,4.5,0,10.1c0,5,3.7,9.1,8.4,9.9v-7H5.9v-2.9h2.5V7.9C8.4,5.4,9.9,4,12.2,4c1.1,0,2.2,0.2,2.2,0.2v2.5h-1.3c-1.2,0-1.6,0.8-1.6,1.6v1.9h2.8L13.9,13h-2.3v7C16.3,19.2,20,15.1,20,10.1z"/>
        </svg>
      ),
      color: '#557dbc'
    },
    {
      name: 'LINE',
      url: `https://line.me/R/msg/text/?${shareTitle}%20${shareUrl}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M16.1 8.2c.3 0 .5.2.5.5s-.2.5-.5.5h-1.5v.9h1.5c.3 0 .5.2.5.5s-.2.5-.5.5h-2c-.3 0-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5h2c.3 0 .5.2.5.5s-.2.5-.5.5h-1.5V8h1.5zm-3.2 2.5c0 .2-.1.4-.4.5h-.2c-.2 0-.3-.1-.4-.2l-2-2.8v2.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-4c0-.2.1-.4.4-.5h.2c.2 0 .3.1.4.2L12 9.2V6.8c0-.3.2-.5.5-.5s.5.2.5.5v3.9zm-4.8 0c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5s.5.2.5.5v4zm-2 .6h-2c-.3 0-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5s.5.2.5.5v3.5h1.5c.3 0 .5.2.5.5 0 .2-.2.5-.5.5M20 8.6C20 4.1 15.5.5 10 .5S0 4.1 0 8.6c0 4 3.6 7.4 8.4 8 .3.1.8.2.9.5.1.3.1.6 0 .9l-.1.9c0 .3-.2 1 .9.5 1.1-.4 5.8-3.4 7.9-5.8 1.3-1.6 2-3.2 2-5"/>
        </svg>
      ),
      color: '#20be60'
    },
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2.9 0C1.3 0 0 1.3 0 2.9v14.3C0 18.7 1.3 20 2.9 20h14.3c1.6 0 2.9-1.3 2.9-2.9V2.9C20 1.3 18.7 0 17.1 0H2.9zm13.2 3.8L11.5 9l5.5 7.2h-4.3l-3.3-4.4-3.8 4.4H3.4l5-5.7-5.3-6.7h4.4l3 4 3.5-4h2.1zM14.4 15 6.8 5H5.6l7.7 10h1.1z"/>
        </svg>
      ),
      color: '#000000'
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm font-medium text-sunny-gray">分享此文章:</span>
      <div className="flex items-center space-x-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="p-2 rounded-full transition-all duration-200 hover:scale-110 bg-sunny-cream hover:bg-sunny-orange"
            style={{ color: link.color }}
            aria-label={link.name}
          >
            {link.icon}
          </a>
        ))}
        <button
          onClick={copyToClipboard}
          className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
            copied ? 'bg-sunny-orange text-white' : 'bg-sunny-cream text-sunny-dark'
          }`}
          aria-label="複製至剪貼簿"
        >
          {copied ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M20 3.89v6.667a3.89 3.89 0 0 1-3.89 3.89h-.55v-2.223h.55c.921 0 1.667-.746 1.667-1.667V3.889c0-.92-.746-1.666-1.666-1.666H9.443c-.92 0-1.667.746-1.667 1.666v6.668c0 .92.746 1.667 1.667 1.667h1.674v2.222H9.443a3.89 3.89 0 0 1-3.89-3.889V3.889A3.89 3.89 0 0 1 9.444 0h6.668A3.89 3.89 0 0 1 20 3.89Zm-9.443 1.664H8.891v2.222h1.666c.92 0 1.667.746 1.667 1.667v6.668c0 .92-.746 1.666-1.667 1.666H3.889c-.92 0-1.666-.746-1.666-1.666V9.443c0-.92.746-1.667 1.666-1.667h.55V5.554h-.55A3.89 3.89 0 0 0 0 9.443v6.668A3.89 3.89 0 0 0 3.89 20h6.667a3.89 3.89 0 0 0 3.89-3.89V9.444a3.89 3.89 0 0 0-3.89-3.89Z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}


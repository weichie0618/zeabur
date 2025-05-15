/**
 * LINE 消息模板庫
 * 提供多種LINE消息格式模板，包括純文字、圖片、按鈕等
 */

/**
 * 生成純文字消息
 * @param text 消息文字內容
 * @returns LINE文字消息物件
 */
export function createTextMessage(text: string) {
  return {
    type: "text",
    text: text
  };
}

/**
 * 生成圖片消息
 * @param imageUrl 圖片URL
 * @param previewUrl 預覽圖URL (可選，默認使用原圖)
 * @returns LINE圖片消息物件
 */
export function createImageMessage(imageUrl: string, previewUrl?: string) {
  return {
    type: "image",
    originalContentUrl: imageUrl,
    previewImageUrl: previewUrl || imageUrl
  };
}

/**
 * 生成按鈕模板消息
 * @param altText 替代文字 (當無法顯示模板時顯示)
 * @param title 標題文字
 * @param text 內容文字
 * @param actions 按鈕動作數組
 * @returns LINE按鈕模板消息物件
 */
export function createButtonTemplateMessage(
  altText: string,
  title: string,
  text: string,
  actions: any[]
) {
  return {
    type: "template",
    altText: altText,
    template: {
      type: "buttons",
      thumbnailImageUrl: null,
      title: title,
      text: text,
      actions: actions
    }
  };
}

/**
 * 生成確認模板消息
 * @param altText 替代文字
 * @param text 內容文字
 * @param yesLabel 確認按鈕標籤
 * @param noLabel 取消按鈕標籤
 * @param yesData 確認按鈕資料
 * @param noData 取消按鈕資料
 * @returns LINE確認模板消息物件
 */
export function createConfirmTemplateMessage(
  altText: string,
  text: string,
  yesLabel: string,
  noLabel: string,
  yesData: string,
  noData: string
) {
  return {
    type: "template",
    altText: altText,
    template: {
      type: "confirm",
      text: text,
      actions: [
        {
          type: "postback",
          label: yesLabel,
          data: yesData
        },
        {
          type: "postback",
          label: noLabel,
          data: noData
        }
      ]
    }
  };
}

/**
 * 生成輪播模板消息
 * @param altText 替代文字
 * @param columns 輪播項目數組
 * @returns LINE輪播模板消息物件
 */
export function createCarouselTemplateMessage(altText: string, columns: any[]) {
  return {
    type: "template",
    altText: altText,
    template: {
      type: "carousel",
      columns: columns
    }
  };
}

/**
 * 生成通知消息 (可用於系統通知、活動提醒等)
 * @param title 通知標題
 * @param message 通知內容
 * @param iconUrl 圖標URL (可選)
 * @returns 通知消息物件數組
 */
export function createNotificationMessage(title: string, message: string, iconUrl?: string) {
  return [
    {
      type: "flex",
      altText: title,
      contents: {
        type: "bubble",
        size: "kilo",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: title,
              color: "#ffffff",
              align: "start",
              size: "lg",
              weight: "bold",
            },
          ],
          backgroundColor: "#3366CC",
          paddingAll: "12px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                iconUrl ? {
                  type: "image",
                  url: iconUrl,
                  size: "xs",
                  flex: 1,
                  align: "center",
                } : {
                  type: "filler"
                },
                {
                  type: "text",
                  text: message,
                  wrap: true,
                  flex: 5,
                  size: "sm",
                  color: "#666666",
                  margin: iconUrl ? "sm" : "none",
                },
              ],
              spacing: "md",
              margin: "lg",
            },
          ],
        },
        styles: {
          footer: {
            separator: false,
          },
        },
      },
    },
  ];
}

// 消息模板庫對象
export const LineMessageTemplates = {
  text: createTextMessage,
  image: createImageMessage,
  button: createButtonTemplateMessage,
  confirm: createConfirmTemplateMessage,
  carousel: createCarouselTemplateMessage,
  notification: createNotificationMessage,
};

export default LineMessageTemplates; 
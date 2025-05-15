/**
 * LINE Flex 消息模板庫
 * 此檔案包含各種 LINE Flex 消息模板函數，用於生成不同場景下的 LINE Flex 消息
 */

interface FlexMessageOptions {
  altText: string;
  [key: string]: any;
}

/**
 * 生成服務開通成功的 Flex 消息
 * @param storeValue 商店名稱
 * @param lineUsername LINE 用戶名
 * @param expiryDate 服務到期日
 * @returns LINE Flex 消息物件數組
 */
export function createActivationSuccessMessage(storeValue: string, lineUsername: string, expiryDate: string) {
  return [
    {
      type: "flex",
      altText: "開通LINE服務",
      contents: {
        type: "bubble",
        size: "kilo",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "LINE功能開通",
              color: "#ffffff",
              align: "start",
              size: "xl",
              gravity: "center",
              weight: "bold",
            },
          ],
          backgroundColor: "#0367D3",
          paddingTop: "lg",
          paddingAll: "12px",
          paddingBottom: "xs",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  color: "#000000",
                  size: "lg",
                  flex: 5,
                  weight: "bold",
                  text: storeValue,
                },
                {
                  type: "text",
                  text: "到期日:",
                  flex: 3,
                  size: "xxs",
                  gravity: "bottom",
                  color: "#877f7f",
                },
              ],
              spacing: "none",
              cornerRadius: "30px",
              margin: "sm",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: lineUsername + " 你好",
                  color: "#000000",
                  size: "sm",
                  flex: 5,
                  weight: "bold",
                },
                {
                  type: "text",
                  text: expiryDate,
                  flex: 3,
                  size: "sm",
                  color: "#877f7f",
                },
              ],
              spacing: "lg",
              cornerRadius: "30px",
              margin: "sm",
            },
            {
              type: "separator",
              margin: "md",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "LINE功能列表",
                  weight: "bold",
                  color: "#1DB446",
                  size: "sm",
                  margin: "md",
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "📚",
                          flex: 1,
                          size: "sm",
                        },
                        {
                          type: "text",
                          text: "文宣品申購(服務即將上線)",
                          flex: 5,
                          size: "sm",
                          color: "#555555",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "🎥",
                          flex: 1,
                          size: "sm",
                        },
                        {
                          type: "text",
                          text: "教學影片觀看",
                          flex: 5,
                          size: "sm",
                          color: "#555555",
                        },
                      ],
                      margin: "md",
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "🤖",
                          flex: 1,
                          size: "sm",
                        },
                        {
                          type: "text",
                          text: "LINE機器人",
                          flex: 5,
                          size: "sm",
                          color: "#555555",
                        },
                      ],
                      margin: "md",
                    },
                  ],
                  margin: "lg",
                },
              ],
            },
          ],
          paddingBottom: "md",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "secondary",
              height: "sm",
              action: {
                type: "uri",
                label: "使用方式",
                uri: process.env.NEXT_PUBLIC_HOWTOUSE_URL || "#",
              },
            },
          ],
        },
        styles: {
          footer: {
            separator: true,
          },
        },
      },
    },
  ];
}

// 更多 Flex 消息模板可以在此處添加
// 例如：產品購買確認、訂單狀態更新、促銷活動通知等

/**
 * 生成訂單確認的 Flex 消息
 * @param orderNumber 訂單編號
 * @param productName 產品名稱
 * @param amount 金額
 * @param orderDate 訂單日期
 * @returns LINE Flex 消息物件數組
 */
export function createOrderConfirmMessage(orderNumber: string, productName: string, amount: number, orderDate: string) {
  return [
    {
      type: "flex",
      altText: "訂單確認通知",
      contents: {
        type: "bubble",
        size: "kilo",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "訂單確認",
              color: "#ffffff",
              align: "start",
              size: "xl",
              gravity: "center",
              weight: "bold",
            },
          ],
          backgroundColor: "#27AE60",
          paddingTop: "lg",
          paddingAll: "12px",
          paddingBottom: "xs",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "訂單編號",
                  color: "#aaaaaa",
                  size: "sm",
                },
                {
                  type: "text",
                  text: orderNumber,
                  color: "#1f1f1f",
                  size: "md",
                  weight: "bold",
                }
              ],
              spacing: "sm",
              margin: "md"
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "商品",
                  color: "#aaaaaa",
                  size: "sm"
                },
                {
                  type: "text",
                  text: productName,
                  wrap: true,
                  color: "#1f1f1f",
                  size: "md"
                }
              ],
              spacing: "sm",
              margin: "md"
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "金額",
                  color: "#aaaaaa",
                  size: "sm"
                },
                {
                  type: "text",
                  text: `NT$${amount.toLocaleString()}`,
                  color: "#1DB446",
                  size: "md",
                  weight: "bold"
                }
              ],
              spacing: "sm",
              margin: "md"
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "訂單日期",
                  color: "#aaaaaa",
                  size: "sm"
                },
                {
                  type: "text",
                  text: orderDate,
                  color: "#1f1f1f",
                  size: "md"
                }
              ],
              spacing: "sm",
              margin: "md"
            }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "primary",
              height: "sm",
              action: {
                type: "uri",
                label: "查看訂單詳情",
                uri: "https://example.com/orders"
              }
            }
          ]
        },
        styles: {
          footer: {
            separator: true
          }
        }
      }
    }
  ];
}

/**
 * 範本庫物件 - 集中管理所有 Flex 模板
 */
export const FlexTemplates = {
  activation: createActivationSuccessMessage,
  orderConfirm: createOrderConfirmMessage,
  // 將來可以添加更多模板
};

export default FlexTemplates; 
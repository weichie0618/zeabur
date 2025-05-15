/**
 * LINE Flex Message 輔助工具函數
 * 提供用於創建和組合 LINE Flex Message 的通用工具函數
 */

/**
 * 創建文字內容元素
 */
export function createTextContent(
  text: string,
  options: {
    size?: string;
    color?: string;
    weight?: string;
    align?: string;
    wrap?: boolean;
    maxLines?: number;
  } = {}
) {
  return {
    type: "text",
    text,
    size: options.size || "md",
    color: options.color || "#000000",
    weight: options.weight,
    align: options.align,
    wrap: options.wrap,
    maxLines: options.maxLines
  };
}

/**
 * 創建分隔線
 */
export function createSeparator(margin?: string) {
  return {
    type: "separator",
    margin: margin || "md"
  };
}

/**
 * 創建圖片內容元素
 */
export function createImageContent(
  url: string,
  options: {
    size?: string;
    aspectRatio?: string;
    aspectMode?: string;
    align?: string;
  } = {}
) {
  return {
    type: "image",
    url,
    size: options.size || "md",
    aspectRatio: options.aspectRatio || "1:1",
    aspectMode: options.aspectMode || "cover",
    align: options.align
  };
}

/**
 * 創建按鈕元素
 */
export function createButton(
  label: string,
  uri: string,
  options: {
    style?: string;
    color?: string;
    height?: string;
  } = {}
) {
  return {
    type: "button",
    action: {
      type: "uri",
      label,
      uri
    },
    style: options.style || "primary",
    color: options.color,
    height: options.height || "md"
  };
}

/**
 * 創建垂直盒子容器
 */
export function createVerticalBox(
  contents: any[],
  options: {
    spacing?: string;
    margin?: string;
    paddingAll?: string;
    backgroundColor?: string;
  } = {}
) {
  return {
    type: "box",
    layout: "vertical",
    contents,
    spacing: options.spacing,
    margin: options.margin,
    paddingAll: options.paddingAll,
    backgroundColor: options.backgroundColor
  };
}

/**
 * 創建水平盒子容器
 */
export function createHorizontalBox(
  contents: any[],
  options: {
    spacing?: string;
    margin?: string;
    paddingAll?: string;
    backgroundColor?: string;
  } = {}
) {
  return {
    type: "box",
    layout: "horizontal",
    contents,
    spacing: options.spacing,
    margin: options.margin,
    paddingAll: options.paddingAll,
    backgroundColor: options.backgroundColor
  };
}

/**
 * 創建帶有圖標的文字項目
 */
export function createIconTextItem(
  icon: string,
  text: string,
  options: {
    iconSize?: string;
    textColor?: string;
    textSize?: string;
    spacing?: string;
  } = {}
) {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: icon,
        flex: 1,
        size: options.iconSize || "sm"
      },
      {
        type: "text",
        text,
        flex: 5,
        size: options.textSize || "sm",
        color: options.textColor || "#555555"
      }
    ],
    spacing: options.spacing || "md"
  };
}

/**
 * 創建頁頭區域
 */
export function createHeader(
  title: string,
  options: {
    backgroundColor?: string;
    textColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingAll?: string;
  } = {}
) {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: title,
        color: options.textColor || "#ffffff",
        align: "start",
        size: "xl",
        gravity: "center",
        weight: "bold"
      }
    ],
    backgroundColor: options.backgroundColor || "#1DB446",
    paddingTop: options.paddingTop || "lg",
    paddingAll: options.paddingAll || "12px",
    paddingBottom: options.paddingBottom || "xs"
  };
}

/**
 * 創建帶有標籤和值的資訊項目
 */
export function createInfoItem(
  label: string,
  value: string,
  options: {
    labelColor?: string;
    valueColor?: string;
    labelSize?: string;
    valueSize?: string;
    valueWeight?: string;
  } = {}
) {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: label,
        color: options.labelColor || "#aaaaaa",
        size: options.labelSize || "sm"
      },
      {
        type: "text",
        text: value,
        color: options.valueColor || "#1f1f1f",
        size: options.valueSize || "md",
        weight: options.valueWeight
      }
    ],
    spacing: "sm",
    margin: "md"
  };
}

/**
 * 創建基本氣泡容器
 */
export function createBubble(
  header: any,
  body: any,
  footer?: any,
  styles?: any,
  size?: string
) {
  return {
    type: "bubble",
    size: size || "mega",
    header,
    body,
    footer,
    styles
  };
}

export default {
  createTextContent,
  createSeparator,
  createImageContent,
  createButton,
  createVerticalBox,
  createHorizontalBox,
  createIconTextItem,
  createHeader,
  createInfoItem,
  createBubble
}; 
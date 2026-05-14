const cloud = require("wx-server-sdk");
const https = require("https");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/** 与小程序 mock/products 对齐，供 LLM 白名单与规则兜底 */
const CATALOG = [
  { id: "p1", name: "经典美式", subtitle: "低酸平衡 · 中深烘" },
  { id: "p2", name: "澳白", subtitle: "更绵密奶泡 · 香气突出" },
  { id: "p3", name: "耶加雪菲 手冲", subtitle: "柑橘与花香" },
  { id: "p4", name: "可颂三件套", subtitle: "咖啡 + 可颂 组合更省" },
  { id: "p5", name: "卡布奇诺", subtitle: "奶泡细腻 · 经典之选" },
  { id: "p6", name: "冰美式", subtitle: "冰爽清冽，提神首选" },
  { id: "p7", name: "燕麦拿铁", subtitle: "植物奶首选，轻盈不腻" },
  { id: "p8", name: "低因澳白", subtitle: "瑞士水处理低因 · 夜晚也能喝" },
  {
    id: "p9",
    name: "栀子燕麦拿铁（初夏限定）",
    subtitle: "栀子花香 · 燕麦奶清爽",
  },
];

const DEFAULT_PRODUCT_ID = "p2";
const VALID_IDS = new Set(CATALOG.map((p) => p.id));

function sanitizeProductId(id) {
  const s = typeof id === "string" ? id.trim() : "";
  if (s && VALID_IDS.has(s)) return s;
  return DEFAULT_PRODUCT_ID;
}

function normalizeInputText(text) {
  return String(text || "")
    .trim()
    .slice(0, 500);
}

function normalizeMoodForRules(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

const MOOD_TEXT_RULES = [
  {
    test: (n) =>
      /冰|暑|解渴|夏天|三伏|燥热|来杯冰/.test(n) &&
      !/不要冰|去冰|少冰|热饮/.test(n),
    productId: "p6",
    reason:
      "你提到了消暑或冰饮感，这杯冰美式清冽顺口，很适合提神醒脑。",
  },
  {
    test: (n) =>
      /低因|脱因|睡不着|晚上喝|咖啡因敏感|不含咖啡因|戒咖啡因/.test(n),
    productId: "p8",
    reason:
      "听起来需要控制咖啡因，这杯瑞士水处理低因澳白保留奶咖香气，更适合晚间或敏感体质。",
  },
  {
    test: (n) => /栀子|初夏限定/.test(n),
    productId: "p9",
    reason:
      "初夏限定栀子燕麦拿铁，花香清爽配燕麦奶，很适合现在这个时节慢慢喝。",
  },
  {
    test: (n) =>
      /手冲|耶加|雪菲|果酸|花香|慢饮|阅读|周末|层次感/.test(n),
    productId: "p3",
    reason:
      "听起来想慢一点、喝出香气层次，手冲耶加雪菲的花果调很适合现在的心情。",
  },
  {
    test: (n) => /燕麦|植物奶|燕麦奶/.test(n),
    productId: "p7",
    reason:
      "你提到了燕麦或植物奶，这杯燕麦拿铁香气温和，饱腹感和心情都更柔一点。",
  },
  {
    test: (n) => /卡布|卡布奇诺|厚奶泡|蓬松奶泡/.test(n),
    productId: "p5",
    reason:
      "经典奶咖比例和绵密奶泡，卡布奇诺很适合想喝「有咖啡骨架的奶咖」时。",
  },
  {
    test: (n) => /饿|早餐|可颂|轻食|双人|分享|三件套|下午茶/.test(n),
    productId: "p4",
    reason: "听起来需要一点扎实的搭配，咖啡配可颂的组合省心又好拍。",
  },
  {
    test: (n) =>
      /奶|松弛|治愈|澳白|flatwhite|绵密|温柔|午后|安全感|奶油/.test(n),
    productId: "p2",
    reason:
      "你描述的状态很适合一杯绵密澳白，奶香把浓缩包得更温柔。",
  },
  {
    test: (n) =>
      /困|累|加班|熬夜|提神|清醒|早八|通勤|专注|会议|码字|美式|黑咖|浓缩/.test(
        n,
      ),
    productId: "p1",
    reason:
      "根据你提到的疲惫或需要清醒感，经典美式干净利落，很适合提神但不拖泥带水。",
  },
];

function recommendByRules(rawText) {
  const normalized = normalizeMoodForRules(rawText);
  if (!normalized) {
    return {
      productId: sanitizeProductId(DEFAULT_PRODUCT_ID),
      reason: "可以先点一杯招牌澳白，喝完再慢慢说今天的心情也不迟。",
      source: "fallback",
    };
  }
  for (let i = 0; i < MOOD_TEXT_RULES.length; i += 1) {
    const rule = MOOD_TEXT_RULES[i];
    if (rule.test(normalized)) {
      return {
        productId: sanitizeProductId(rule.productId),
        reason: rule.reason,
        source: "rules",
      };
    }
  }
  return {
    productId: sanitizeProductId(DEFAULT_PRODUCT_ID),
    reason:
      "没从话里抓到太具体的关键词，先为你选门店很受欢迎的澳白，通常不容易踩雷。",
    source: "fallback",
  };
}

function postHttpsJson(urlString, headers, bodyObj) {
  const body = JSON.stringify(bodyObj);
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(urlString);
    } catch (e) {
      reject(new Error("invalid LLM_API_BASE / URL"));
      return;
    }
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => {
          data += c;
        });
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(new Error("LLM response not JSON"));
            }
          } else {
            reject(
              new Error(
                `LLM HTTP ${res.statusCode}: ${data.slice(0, 400)}`,
              ),
            );
          }
        });
      },
    );
    req.setTimeout(55000, () => {
      req.destroy();
      reject(new Error("LLM request timeout"));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function buildCatalogPromptLines() {
  return CATALOG.map(
    (p) => `- ${p.id}: ${p.name}（${p.subtitle}）`,
  ).join("\n");
}

async function recommendByLlm(userText) {
  const apiKey = process.env.LLM_API_KEY || "";
  const apiBase = (process.env.LLM_API_BASE || "https://api.openai.com/v1")
    .replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  if (!apiKey) {
    throw new Error("LLM_API_KEY 未配置");
  }
  const catalogBlock = buildCatalogPromptLines();
  const system = [
    "你是精品咖啡小程序的推荐助手。根据用户一两句心情描述，从给定商品中只选一款。",
    "必须只使用下列 productId 之一，不能用列表外的 id：",
    catalogBlock,
    "输出要求：仅输出一个 JSON 对象，不要 markdown，不要解释。字段：",
    'productId（字符串，必填）、reason（字符串，一句中文推荐语，20～80 字）。',
  ].join("\n");
  const url = `${apiBase}/chat/completions`;
  const payload = {
    model,
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `用户说：${userText}`,
      },
    ],
    temperature: 0.6,
    response_format: { type: "json_object" },
  };
  const raw = await postHttpsJson(url, { Authorization: `Bearer ${apiKey}` }, payload);
  const content = raw.choices && raw.choices[0] && raw.choices[0].message && raw.choices[0].message.content;
  if (!content || typeof content !== "string") {
    throw new Error("LLM empty content");
  }
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error("LLM content not valid JSON");
  }
  const pid = sanitizeProductId(parsed.productId);
  const reason =
    typeof parsed.reason === "string" && parsed.reason.trim()
      ? parsed.reason.trim().slice(0, 200)
      : "为你挑了这杯，点开详情看看是否符合今天的心情。";
  return { productId: pid, reason, source: "llm" };
}

exports.main = async (event) => {
  const text = normalizeInputText(event && event.text);
  const preferRules = event && event.preferRules === true;
  try {
    /** 默认不接大模型（与小程序 mock 一致）。云端环境变量 MOOD_USE_LLM=1 且已配 LLM_API_KEY 时才走 LLM */
    const useLlm =
      !preferRules &&
      process.env.MOOD_USE_LLM === "1" &&
      process.env.LLM_API_KEY;
    if (useLlm) {
      const out = await recommendByLlm(text);
      return { ok: true, ...out };
    }
  } catch (e) {
    console.error("recommendByMood llm error", e && e.message);
  }
  const fallback = recommendByRules(text);
  return { ok: true, ...fallback };
};

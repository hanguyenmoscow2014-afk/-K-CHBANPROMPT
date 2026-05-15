import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client
let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

const SYSTEM_PROMPT = `Bạn là một chuyên gia biên kịch và kỹ sư prompt cao cấp. Nhiệm vụ của bạn là tiếp nhận dữ liệu đầu vào (Link, Video, hoặc Văn bản) và viết lại thành một kịch bản hoàn toàn mới nhưng vẫn giữ được "linh hồn" của bản gốc.

1. Nguyên tắc cốt lõi:
- Độ sáng tạo: Nội dung mới chỉ được phép giống kịch bản gốc từ 30% - 50%. Thay đổi tình tiết, lời thoại và cách dẫn dắt.
- Sự đồng nhất: Giữ nguyên phong cách (ví dụ: hài hước, kịch tính, chuyên nghiệp), văn phong và ngữ cảnh cốt lõi của chủ đề.
- Thời lượng: Bạn PHẢI tuân thủ nghiêm ngặt tổng thời lượng kịch bản mà người dùng yêu cầu. Tổng thời gian của tất cả các phân đoạn phải khớp chính xác với thời lượng yêu cầu.
- Cấu trúc phân cảnh: Chia nhỏ kịch bản thành từng phân đoạn. Đối với kịch bản ngắn (< 60s), phân đoạn từ 5s-10s. Đối với kịch bản dài (> 60s), phân đoạn có thể 10s-20s để tránh quá nhiều phân đoạn nhưng vẫn đảm bảo tính chi tiết.
- Đa phương tiện: Mỗi phân cảnh phải đi kèm Prompt hình ảnh và Prompt video chi tiết.

2. Cấu trúc đầu ra (JSON):
Trả về một JSON object có cấu trúc sau:
{
  "segments": [
    {
      "timeRange": "00:00 - 00:05",
      "content": "[Nội dung viết lại]",
      "imagePrompt": "[Mô tả ảnh chất lượng cao]",
      "videoPrompt": "[Mô tả chuyển động camera]"
    }
  ],
  "srt": "[Nội dung file SRT cực kỳ chính xác, khớp với các phân đoạn trên]",
  "imagePromptsBlock": "[Danh sách các câu lệnh hình ảnh liên tiếp]",
  "videoPromptsBlock": "[Danh sách các câu lệnh video liên tiếp]"
}

Lưu ý:
- Phải trả về JSON thuần túy để parser có thể đọc được.
- Đảm bảo tính sáng tạo cao nhưng vẫn đúng chủ đề.
- Rất quan trọng: Tổng thời gian trong timeRange của segment cuối cùng phải kết thúc đúng tại thời lượng yêu cầu.`;

app.post("/api/generate", async (req, res) => {
  try {
    const { input, duration } = req.body;
    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    const durationText = duration ? `YÊU CẦU QUAN TRỌNG: Viết kịch bản có TỔNG THỜI LƯỢNG CHÍNH XÁC LÀ ${duration} GIÂY. Phân bổ các đoạn sao cho hợp lý để đạt được con số này.` : "";
    const prompt = `Hãy viết lại kịch bản cho nội dung sau đây. ${durationText}\n\nNội dung gốc:\n${input}`;
    
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("AI không trả về nội dung.");
    }
    
    let cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
    
    if (!cleanJson.startsWith("{")) {
       const firstBrace = cleanJson.indexOf("{");
       const lastBrace = cleanJson.lastIndexOf("}");
       if (firstBrace !== -1 && lastBrace !== -1) {
           cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
       }
    }
    
    try {
      const data = JSON.parse(cleanJson);
      if (!data.segments || !Array.isArray(data.segments)) {
        throw new Error("AI trả về dữ liệu thiếu cấu trúc phân đoạn.");
      }
      res.json(data);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw context:", cleanJson);
      res.status(500).json({ 
        error: "Dữ liệu trả về từ AI không hợp lệ hoặc thiếu cấu trúc. Vui lòng thử lại với nội dung rõ ràng hơn.",
        debug: cleanJson.substring(0, 500)
      });
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Lỗi kết nối với trí tuệ nhân tạo: " + (error.message || "Unknown error") });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Nenhuma mensagem foi enviada."
      });
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      instructions: `
Você é a Gideon, uma assistente virtual inteligente.

Seu jeito de conversar deve ser natural, humano e espontâneo.
Não responda como um robô de suporte técnico.
Seja clara, amigável e objetiva.
Entenda o contexto das mensagens anteriores quando ele estiver disponível.
Não invente informações quando não souber algo.
      `,
      input: message
    });

    res.json({
      reply: response.output_text
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Não consegui processar sua mensagem agora."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gideon Backend rodando na porta ${PORT}`);
});

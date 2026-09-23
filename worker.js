export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (url.pathname === "/favicon.png") {
    return env.ASSETS.fetch(request);
      return env.ASSETS.fetch(request);
}
    
    // TESTE DO ENDPOINT
    if (url.pathname === "/api/chat" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "online",
          message: "GIDEON API está funcionando!"
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    // CONVERSA COM A OPENAI
    if (
      url.pathname === "/api/chat" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json();
        const message = body.message;

        if (!message || typeof message !== "string") {
          return new Response(
            JSON.stringify({
              error: "Mensagem inválida."
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        const apiKey = env.OPENAI_API_KEY;

        if (!apiKey) {
          return new Response(
            JSON.stringify({
              error: "OPENAI_API_KEY não configurada."
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        const openaiResponse = await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: "gpt-5.6",

              instructions:
                "Você é GIDEON, uma assistente de inteligência artificial criada pelo usuário. Seu nome é GIDEON. Quando perguntarem quem você é, diga que você é a GIDEON. Não diga que você é o ChatGPT. Explique, se necessário, que você utiliza tecnologia da OpenAI como seu núcleo de inteligência. Responda de forma natural, clara e útil.",

              input: message
            })
          }
        );

        const data = await openaiResponse.json();

        // ERRO DA OPENAI
        if (!openaiResponse.ok) {
          console.error("Erro da OpenAI:", data);

          return new Response(
            JSON.stringify({
              error: data
            }),
            {
              status: openaiResponse.status,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        // TENTA PEGAR O TEXTO DIRETAMENTE
        let answer = data.output_text;

        // CASO output_text NÃO EXISTA,
        // PROCURA O TEXTO DENTRO DE output
        if (!answer && Array.isArray(data.output)) {
          for (const item of data.output) {
            if (
              item.type === "message" &&
              Array.isArray(item.content)
            ) {
              for (const content of item.content) {
                if (
                  content.type === "output_text" &&
                  typeof content.text === "string"
                ) {
                  answer = content.text;
                  break;
                }
              }
            }

            if (answer) {
              break;
            }
          }
        }

        // SE NÃO ENCONTRAR TEXTO
        if (!answer) {
          console.error(
            "Resposta completa da OpenAI:",
            data
          );

          return new Response(
            JSON.stringify({
              error:
                "A OpenAI respondeu, mas nenhum texto foi encontrado.",
              raw: data
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        // RESPOSTA NORMAL PARA O GIDEON
        return new Response(
          JSON.stringify({
            response: answer
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );

      } catch (error) {
        console.error("Erro interno:", error);

        return new Response(
          JSON.stringify({
            error: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }

    // SITE
    return env.ASSETS.fetch(request);
  }
};

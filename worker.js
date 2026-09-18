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
              input: message
            })
          }
        );

        const data = await openaiResponse.json();

        // Se a OpenAI retornar erro, mostrar o erro real
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

        // Tenta pegar o texto diretamente
        let answer = data.output_text;

        // Caso output_text não exista, procura o texto dentro de output
        if (!answer && Array.isArray(data.output)) {
          for (const item of data.output) {
            if (item.type === "message" && Array.isArray(item.content)) {
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

            if (answer) break;
          }
        }

        // Se ainda não encontrou texto, devolve informações de diagnóstico
        if (!answer) {
          console.error("Resposta completa da OpenAI:", data);

          return new Response(
            JSON.stringify({
              error: "A OpenAI respondeu, mas nenhum texto foi encontrado.",
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

        // Resposta normal para o Gideon
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Permite requisições de outros domínios
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // ==============================
    // GIDEON IA
    // ==============================

    if (
      request.method === "POST" &&
      url.pathname === "/api/chat"
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

        // A chave NÃO fica aqui.
        // Ela fica protegida nos Secrets do Cloudflare.
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

        // Envia a mensagem para a OpenAI
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

        // Se a OpenAI retornar erro
        if (!openaiResponse.ok) {
          console.error("Erro da OpenAI:", data);

          return new Response(
            JSON.stringify({
              error: "Erro ao conversar com a OpenAI."
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

        // Pega a resposta da IA
        const answer =
          data.output_text ||
          "Não consegui gerar uma resposta.";

        // Devolve a resposta para o index.html
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
        console.error("Erro no GIDEON:", error);

        return new Response(
          JSON.stringify({
            error: "Erro interno do GIDEON."
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

    // ==============================
    // SITE DO GIDEON
    // ==============================

    return env.ASSETS.fetch(request);
  }
};

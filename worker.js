export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Permite as requisições CORS do site
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Endpoint de conversa do GIDEON
    if (request.method === "POST" && url.pathname === "/api/chat") {
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

        // A chave fica protegida no Cloudflare como Secret
        const apiKey = env.OPENAI_API_KEY;

        if (!apiKey) {
          return new Response(
            JSON.stringify({
              error: "OPENAI_API_KEY não configurada no Cloudflare."
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

        if (!openaiResponse.ok) {
          console.error("Erro da OpenAI:", data);

          return new Response(
            JSON.stringify({
              error: "A OpenAI recusou a requisição."
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

        // Retorna a resposta para o index.html
        return new Response(
          JSON.stringify({
            response: data.output_text || "Não consegui gerar uma resposta."
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
        console.error("Erro no Worker:", error);

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

    // Resposta para acessar o Worker diretamente
    if (request.method === "GET") {
      return new Response(
        "GIDEON Worker online. Endpoint: /api/chat",
        {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=UTF-8",
            ...corsHeaders
          }
        }
      );
    }

    return new Response("Método não permitido.", {
      status: 405,
      headers: corsHeaders
    });
  }
};

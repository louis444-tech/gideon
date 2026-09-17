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

        return new Response(
          JSON.stringify({
            response:
              data.output_text ||
              "Não consegui gerar uma resposta."
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

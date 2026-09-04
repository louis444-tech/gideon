export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Permite que o navegador faça a requisição inicial de CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Só aceitamos POST
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método não permitido." }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    try {
      const body = await request.json();
      const message = body.message;

      if (!message) {
        return new Response(
          JSON.stringify({ error: "Nenhuma mensagem foi enviada." }),
          {
            status: 400,
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
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-5-mini",
            instructions: `
Você é Gideon, uma assistente virtual inteligente.

Converse de maneira natural, humana e espontânea.
Seja amigável, clara e objetiva.
Evite respostas robóticas, repetitivas ou excessivamente formais.
Não diga que está "aprendendo a processar" uma solicitação.
Se não souber alguma coisa, admita de forma natural.
            `,
            input: message
          })
        }
      );

      const data = await openaiResponse.json();

      if (!openaiResponse.ok) {
        console.error(data);

        return new Response(
          JSON.stringify({
            error: "Não consegui obter uma resposta da IA."
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

      return new Response(
        JSON.stringify({
          reply: data.output_text
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
      console.error(error);

      return new Response(
        JSON.stringify({
          error: "Ocorreu um erro no servidor da Gideon."
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
};

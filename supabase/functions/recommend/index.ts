// Edge Function: recomendaciones de lectura según el perfil del lector.
// Desplegar:  npx supabase functions deploy recommend --project-ref TU_REF
// Secret:     npx supabase secrets set GROQ_API_KEY=gsk_... --project-ref TU_REF
// La verificación de JWT viene activada por defecto: solo usuarios con sesión pueden llamarla.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { profile } = await req.json();
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) throw new Error('GROQ_API_KEY no está configurada');

    const system = `Eres el motor de recomendaciones de Margen, una app personal de notas de lectura.
Recibes el perfil de un lector: sus libros (con estado y puntuación 1-5), sus tags más usados y qué tipo de notas toma.
Recomienda exactamente 3 libros que NO estén en su lista. Prioriza afinidad real con lo mejor puntuado y los tags; varía entre opciones seguras y un descubrimiento.
Prefiere libros con edición en español cuando existan.
Responde SOLO con JSON válido, sin markdown ni texto extra, con esta forma:
{"recommendations":[{"title":"...","author":"...","reason":"una frase en español, específica, citando qué del perfil la motiva"}]}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
        max_tokens: 600,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify(profile) },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Groq respondió ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error inesperado' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

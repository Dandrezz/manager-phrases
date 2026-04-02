export interface Env {
  DB: D1Database;
}

interface Frase {
  id: number;
  texto: string;
  etiquetas: string | null;
  creado_en: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers });
    }

    try {
      // GET /frases — listar todas (con búsqueda opcional ?q=texto&etiqueta=)
      if (method === "GET" && path === "/frases") {
        const q = url.searchParams.get("q");
        const etiqueta = url.searchParams.get("etiqueta");

        let query = "SELECT * FROM frases";
        const params: string[] = [];
        const conditions: string[] = [];

        if (q) {
          conditions.push("(texto LIKE ? OR autor LIKE ?)");
          params.push(`%${q}%`, `%${q}%`);
        }
        if (etiqueta) {
          conditions.push("etiquetas LIKE ?");
          params.push(`%${etiqueta}%`);
        }
        if (conditions.length > 0) {
          query += " WHERE " + conditions.join(" AND ");
        }
        query += " ORDER BY creado_en DESC";

        const { results } = await env.DB.prepare(query).bind(...params).all<Frase>();
        return new Response(JSON.stringify(results), { headers });
      }

      // GET /frases/:id — obtener una frase
      const matchId = path.match(/^\/frases\/(\d+)$/);
      if (method === "GET" && matchId) {
        const id = matchId[1];
        const frase = await env.DB.prepare("SELECT * FROM frases WHERE id = ?").bind(id).first<Frase>();
        if (!frase) {
          return new Response(JSON.stringify({ error: "Frase no encontrada" }), { status: 404, headers });
        }
        return new Response(JSON.stringify(frase), { headers });
      }

      // POST /frases — crear una frase
      if (method === "POST" && path === "/frases") {
        const body = await request.json() as Partial<Frase>;
        if (!body.texto) {
          return new Response(JSON.stringify({ error: "El campo 'texto' es obligatorio" }), { status: 400, headers });
        }
        const result = await env.DB.prepare(
          "INSERT INTO frases (texto, etiquetas) VALUES (?, ?) RETURNING *"
        )
          .bind(body.texto, body.etiquetas ?? null)
          .first<Frase>();
        return new Response(JSON.stringify(result), { status: 201, headers });
      }

      // PUT /frases/:id — actualizar una frase
      if (method === "PUT" && matchId) {
        const id = matchId[1];
        const body = await request.json() as Partial<Frase>;
        const existing = await env.DB.prepare("SELECT * FROM frases WHERE id = ?").bind(id).first<Frase>();
        if (!existing) {
          return new Response(JSON.stringify({ error: "Frase no encontrada" }), { status: 404, headers });
        }
        const updated = await env.DB.prepare(
          "UPDATE frases SET texto = ?, etiquetas = ? WHERE id = ? RETURNING *"
        )
          .bind(
            body.texto ?? existing.texto,
            body.etiquetas ?? existing.etiquetas,
            id
          )
          .first<Frase>();
        return new Response(JSON.stringify(updated), { headers });
      }

      // DELETE /frases/:id — eliminar una frase
      if (method === "DELETE" && matchId) {
        const id = matchId[1];
        const existing = await env.DB.prepare("SELECT id FROM frases WHERE id = ?").bind(id).first();
        if (!existing) {
          return new Response(JSON.stringify({ error: "Frase no encontrada" }), { status: 404, headers });
        }
        await env.DB.prepare("DELETE FROM frases WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ mensaje: "Frase eliminada" }), { headers });
      }

      return new Response(JSON.stringify({ error: "Ruta no encontrada" }), { status: 404, headers });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error interno";
      return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
    }
  },
};

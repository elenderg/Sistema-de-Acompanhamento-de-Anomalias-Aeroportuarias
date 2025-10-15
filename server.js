// arquivo: server.js
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// conexão com o banco de dados
const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "SENHA_DO_BANCO",
  database: "nome_do_banco"
});

// rota para buscar a localidade pelo e-mail
app.get("/localidade", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).send("Email é obrigatório.");
  }

  try {
    const [rows] = await db.execute(
      "SELECT localidade FROM filiais WHERE email = ?",
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).send("Usuário não encontrado.");
    }
    res.json({ localidade: rows[0].localidade });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao consultar banco de dados.");
  }
});

app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));

const { sequelize } = require("../db/sequelize");
const MovimentacaoVeiculoModel = require("./MovimentacaoVeiculo");

const MovimentacaoVeiculo = MovimentacaoVeiculoModel(sequelize);

async function initDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado ao SQL Server.");
    // use em DEV; comente em produção:
    // await sequelize.sync({ alter: true });
  } catch (e) {
    console.error("❌ Erro conectando ao SQL Server:", e.message);
    process.exit(1);
  }
}

module.exports = {
  sequelize,
  initDB,
  MovimentacaoVeiculo,
};

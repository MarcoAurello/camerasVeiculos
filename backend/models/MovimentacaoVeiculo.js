const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize) => {
  const MovimentacaoVeiculo = sequelize.define(
    "MovimentacaoVeiculo",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: () => uuidv4(),
      },
      placa: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      entrada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      saida: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "movimentacaoVeiculo",
      timestamps: true,
    }
  );

  return MovimentacaoVeiculo;
};

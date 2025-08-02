const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Stake = sequelize.define('Stake', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userAddress: {
      type: DataTypes.STRING(42),
      allowNull: false,
      field: 'user_address'
    },
    amount: {
      type: DataTypes.DECIMAL(65, 0),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    contractAddress: {
      type: DataTypes.STRING(42),
      allowNull: true,
      field: 'contract_address'
    },
    network: {
      type: DataTypes.ENUM('mainnet', 'testnet'),
      defaultValue: 'testnet'
    },
    status: {
      type: DataTypes.ENUM('active', 'withdrawn', 'compounded'),
      defaultValue: 'active'
    },
    rewardAmount: {
      type: DataTypes.DECIMAL(65, 0),
      allowNull: true,
      defaultValue: 0,
      field: 'reward_amount'
    },
    rewardClaimed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'reward_claimed'
    },
    rewardClaimedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reward_claimed_at'
    }
  }, {
    tableName: 'stakes',
    timestamps: true,
    underscored: true
  });

  Stake.associate = (models) => {
    // Associação com User se necessário
    // Removida associação com address pois não existe no modelo User
    // O userAddress será usado como identificador independente
  };

  return Stake;
}; 
let dispatchConfig = {
  eletronicos: {
    start: "22:00",
    end: "23:00",
    interval: 5000
  },
  academia: {
    start: "22:00",
    end: "04:00",
    interval: 5000
  },
  moda: {
    start: "22:00",
    end: "23:00",
    interval: 5000
  }
};

function getConfig() {
  return dispatchConfig;
}

function updateConfig(newConfig) {
  dispatchConfig = {
    ...dispatchConfig,
    ...newConfig
  };

  console.log('[Dispatcher] Config atual:', dispatchConfig);
}

module.exports = {
  getConfig,
  updateConfig
};

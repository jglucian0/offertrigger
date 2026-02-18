const time = 1 * 60 * 1000

let dispatchConfig = {
  eletronicos: {
    start: "00:00",
    end: "05:00",
    interval: time
  },
  academia: {
    start: "00:00",
    end: "05:00",
    interval: time
  },
  moda: {
    start: "00:00",
    end: "05:00",
    interval: time
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

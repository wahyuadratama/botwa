const AntiDeleteFeature = require('./AntiDeleteFeature');

class AdFeature extends AntiDeleteFeature {
  constructor() {
    super();
    this.name = 'ad';
    this.description = '_Alias untuk antidelete_';
  }
}

module.exports = AdFeature;

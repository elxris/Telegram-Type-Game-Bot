'use strict';

var ClicksLib = {};

ClicksLib.getTotalClicks = function() {
  return this.clicks - this.spent;
};

ClicksLib.getUpgradeClicks = function(upgrade, userUpgrade) {
  return (upgrade.cps || 0.1) * (userUpgrade.lastBuy - Date.now) * 0.001;
};

module.exports = ClicksLib;

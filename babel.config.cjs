// module.exports = {
//     presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
//   };

module.exports = (api) => {
  const isTest = api.env('test');
  // You can use `isTest` to apply presets or plugins conditionally
  return {
    presets: [['@babel/preset-env', { targets: { node: isTest ? 'current' : 'default' } }]],
    // Additional configurations based on isTest if needed
  };
};

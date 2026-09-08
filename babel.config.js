module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Required by react-native-vision-camera + react-native-worklets-core
  // to compile frame processor `'worklet'` functions.
  plugins: ['react-native-worklets-core/plugin'],
};

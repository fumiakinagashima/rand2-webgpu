const path = require("path");
const bundleOutputDir = "./dist";

module.exports = {
    entry: {
        main: "./src/main"  
    },
    output: {
        filename: "[name].build.js",
        path: path.join(__dirname, bundleOutputDir),
        publicPath: 'public/dist/'
    },
    devtool: "source-map",
    resolve: {
        extensions: ['.js', '.ts', '.wgsl']
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: ['/node_modules/']
            },            
            { test: /\.tsx?$/, loader: "ts-loader" },        
            {
                test: /\.css$/,
                sideEffects: true,
                loader: "css-loader"
            },
            {
                test: /\.(wgsl|glsl)$/,
                loader: 'ts-shader-loader'
            }
        ]
    }
};
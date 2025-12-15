/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

const path = require("path");
const dotenv = require("dotenv");
const envFrontend =
  dotenv.config({ path: path.resolve(__dirname, ".env.local.frontend") }).parsed || {};
const fs = require("fs");
const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

async function getHttpsOptions() {
  const certPath = path.resolve(__dirname, "certs/cert.pem");
  const keyPath = path.resolve(__dirname, "certs/key.pem");

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log("[dev-server] Using mkcert certificates from", certPath);
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }

  console.log("[dev-server] Using office-addin-dev-certs fallback certificates");
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      react: ["react", "react-dom"],
      taskpane: {
        import: [
          "./src/taskpane/index.tsx",
          "./src/taskpane/taskpane.html",
          "./src/commands/commands.ts",
        ],
        dependOn: "react",
      },
    },
    output: {
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".html", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: ["ts-loader"],
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          test: /\.(png|jpg|jpeg|ttf|woff|woff2|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.APP_ENV": JSON.stringify(
          envFrontend.APP_ENV || process.env.APP_ENV || "local"
        ),
        "process.env.MSAL_CLIENT_ID": JSON.stringify(
          envFrontend.MSAL_CLIENT_ID || process.env.MSAL_CLIENT_ID || ""
        ),
        "process.env.MSAL_AUTHORITY": JSON.stringify(
          envFrontend.MSAL_AUTHORITY ||
            process.env.MSAL_AUTHORITY ||
            "https://login.microsoftonline.com/common"
        ),
        "process.env.MSAL_REDIRECT_URI": JSON.stringify(
          envFrontend.MSAL_REDIRECT_URI || process.env.MSAL_REDIRECT_URI || "https://localhost:3000"
        ),
        "process.env.MSAL_SCOPES": JSON.stringify(
          envFrontend.MSAL_SCOPES || process.env.MSAL_SCOPES || ""
        ),
      }),
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["polyfill", "taskpane", "react"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets/*",
            to: "assets/[name][ext][query]",
          },
          {
            from: "manifest*.xml",
            to: "[name]" + "[ext]",
            transform(content) {
              return content;
            },
          },
        ],
      }),
      new webpack.ProvidePlugin({
        Promise: ["es6-promise", "Promise"],
      }),
    ],
    devServer: {
      hot: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      host: "localhost",
      allowedHosts: "all",
      client: {
        overlay: true,
      },
      historyApiFallback: true,
      static: false,
      server: {
        type: "https",
        options:
          env.WEBPACK_BUILD || options.https !== undefined
            ? options.https
            : await getHttpsOptions(),
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
    },
  };

  return config;
};

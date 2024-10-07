module.exports = function override (config, env) {
    let loaders = config.resolve
    loaders.fallback = {
        "path": false,
    }

    return config
}

function appendSheets(dbInstance, data) {
    if (!dbInstance || typeof dbInstance.add !== 'function') {
        throw new Error('Invalid miniSheetDB instance or add() not available')
    }

    var colLength = dbInstance.col_length || 0
    var row = new Array(colLength).fill('')

    var keys = Object.keys(data)

    for (var i = 0; i < keys.length; i++) {
        row[i] = data[keys[i]]
    }

    return dbInstance.add(row)
}

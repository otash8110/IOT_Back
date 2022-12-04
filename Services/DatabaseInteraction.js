const { getDatabase, set, ref, get, child, Database, push } = require('firebase/database');

class DatabaseInteraction {
    constructor(firebaseApp) {
        this.firebaseApp = firebaseApp
        this.db = getDatabase(this.firebaseApp);
        this.dbRef = ref(this.db);
    }

    async GetDatabaseValue(path) {
        var result = await get(child(this.dbRef, path));

        if (result.exists()) {
            var resultValue = result.val();
    
            return resultValue;
        } else {
            return null;
        }
    }

    async SetChildArrayNewItem(path, value) {
        const arrRef = child(this.dbRef, path);
        const newRecordRef = push(arrRef);
        set(newRecordRef, value);
    }
}

module.exports = {
    DatabaseInteraction
}
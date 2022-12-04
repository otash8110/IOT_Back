const { getDatabase, set, ref, onValue, get, child } = require('firebase/database');

async function getFamily(firebaseApp) {
    const db = getDatabase(firebaseApp);
    const dbRef = ref(db);
    var result = await get(child(dbRef, 'FamilyIds'))
    if (result.exists()) {
        var arrayOfFamily = result.val();

        return arrayOfFamily;
    } else {
        return null;
    }
}

async function compareMemberId(id, firebaseApp) {
    var familyObject = await getFamily(firebaseApp);
    var familyMember;
    familyObject.forEach((item) => {
        if (item.NUID == id) {
            familyMember = item;
        }
    })
    return familyMember != null ? familyMember : false;
}

module.exports = {
    compareMemberId
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function arrayMove(arr, old_index, new_index) {
    while (old_index < 0) {
        old_index += arr.length;
    }
    while (new_index < 0) {
        new_index += arr.length;
    }
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing purposes
};

class PolyDecompUtilties {
    static convert1DArrayToArrayPairs(array1d) {
        let arrayPairs = [];

        for (let i = 0; i < array1d.length; i += 2) {
            let x = array1d[i];
            let y = array1d[i + 1];
            arrayPairs.push([x, y]);
        }

        return arrayPairs;
    }

    static convertArrayPairsTo1DArray(arrayPairs) {
        let array1d = [];

        for (let i = 0; i < arrayPairs.length; i++) {
            let arrayPair = arrayPairs[i];

            array1d.push(arrayPair[0]);
            array1d.push(arrayPair[1]);
        }

        return array1d;
    }

    static convertVerticesToArrayPairs(vertices) {
        let arrayPairs = [];

        for (let i = 0; i < vertices.length; i++) {
            arrayPairs.push([vertices[i].x, vertices[i].y]);
        }

        return arrayPairs;
    }
}
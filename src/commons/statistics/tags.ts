function tagInsertCallback (payload: unknown) {
    console.log("tagInsertCallback", payload);
}

function tagDeleteCallback (payload: unknown) {
    console.log("tagDeleteCallback", payload);
}

export {tagInsertCallback, tagDeleteCallback}
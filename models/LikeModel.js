// Russell's - Like Model (Re-exports from CustomerModel)
const Customer = require('./CustomerModel');

// Re-export all Like functions from CustomerModel
module.exports = {
    createLike: Customer.createLike.bind(Customer),
    getLike: Customer.getLike.bind(Customer),
    getLikesCount: Customer.getLikesCount.bind(Customer),
    getLikesByCustomer: Customer.getLikesByCustomer.bind(Customer),
    deleteLike: Customer.deleteLike.bind(Customer)
};
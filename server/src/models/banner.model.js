const { Schema, model } = require('mongoose');

const DOCUMENT_NAME = 'Banner';
const COLLECTION_NAME = 'Banners';

const bannerSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        highlight: {
            type: String,
        },
        subtitle: {
            type: String,
        },
        date: {
            type: String,
        },
        cta: {
            type: String,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        link: {
            type: String,
        },
        lightGradient: {
            type: String,
        },
        darkGradient: {
            type: String,
        },
        position: {
            type: String,
            default: 'home_main',
            enum: ['home_main', 'home_sub'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
);

module.exports = model(DOCUMENT_NAME, bannerSchema);

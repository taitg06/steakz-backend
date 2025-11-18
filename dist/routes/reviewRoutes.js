"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controllers_1 = require("../controllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', controllers_1.getReviews);
router.post('/', authMiddleware_1.authenticateToken, controllers_1.createReview);
router.delete('/:id', authMiddleware_1.authenticateToken, controllers_1.deleteReview);
exports.default = router;
//# sourceMappingURL=reviewRoutes.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const menuController_1 = require("../controllers/menuController");
const router = express_1.default.Router();
router.get('/', menuController_1.getMenuItems);
router.post('/', authMiddleware_1.authenticateToken, menuController_1.createMenuItem);
router.put('/:id', authMiddleware_1.authenticateToken, menuController_1.updateMenuItem);
router.delete('/:id', authMiddleware_1.authenticateToken, menuController_1.deleteMenuItem);
exports.default = router;
//# sourceMappingURL=menuRoutes.js.map
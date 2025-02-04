class BreadCalculator {
    constructor() {
        // 配料比例（相对于面粉重量）
        this.baseRatios = {
            salt: 0.02,    // 盐占面粉重量的2%
            sugar: 0.1,    // 糖占面粉重量的10%
            yeast: 0.01,   // 酵母占面粉重量的1%
            liquid: 0.62   // 液体占面粉重量的62%
        };

        this.waterContentRatios = {
            'milk': 0.87,        // 87%的水分
            'yogurt': 0.80,      // 80%的水分
            'light-cream': 0.60, // 60%的水分
            'honey': 0.20        // 20%的水分
        };

        this.recommendRatios = {
            // 湿料建议比例（相对于面粉重量）
            'yogurt': 0.15,         // 酸奶15%
            'honey': 0.05,          // 蜂蜜5%
            'light-cream': 0.15,    // 淡奶油15%
            
            // 粉料建议比例
            'milk-powder': 0.05,    // 奶粉5%
            'cocoa': 0.08,          // 可可粉8%
            'matcha': 0.02,         // 抹茶粉2%
            
            // 馅料建议比例
            'cranberry': 0.15,      // 蔓越莓干15%
            'red-bean': 0.30,       // 红豆沙30%
            'chocolate': 0.20       // 巧克力馅20%
        };

        this.initializeElements();
        this.bindEvents();
        this.initializeStorage();
        this.loadSavedRecipes();
    }

    initializeElements() {
        // 必选原料输入
        this.flourInput = document.getElementById('flour');
        this.liquidType = document.getElementById('liquid-type');

        // 获取所有可选原料的复选框
        this.wetIngredients = document.querySelectorAll('input[name="wet"]');
        this.dryIngredients = document.querySelectorAll('input[name="dry"]');
        this.fillingIngredients = document.querySelectorAll('input[name="filling"]');

        // 结果显示区域
        this.recipeList = document.getElementById('recipe-list');

        // 按钮
        this.calculateButton = document.getElementById('calculate');
        this.saveButton = document.getElementById('save');
        this.historyButton = document.getElementById('show-history');
        this.historyModal = document.getElementById('history-modal');
        this.closeModalButton = this.historyModal.querySelector('.close');
    }

    bindEvents() {
        // 计算按钮事件
        this.calculateButton.addEventListener('click', () => this.calculate());
        
        // 保存按钮事件
        this.saveButton.addEventListener('click', () => this.saveRecipe());

        // 历史记录按钮事件
        this.historyButton.addEventListener('click', () => {
            this.historyModal.style.display = 'block';
            this.loadSavedRecipes();
        });

        this.closeModalButton.addEventListener('click', () => {
            this.historyModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === this.historyModal) {
                this.historyModal.style.display = 'none';
            }
        });
    }

    calculate() {
        const flour = parseFloat(this.flourInput.value) || 0;
        if (flour <= 0) {
            alert('请输入面粉重量！');
            return;
        }

        // 计算基础配料
        const salt = flour * this.baseRatios.salt;
        const sugar = flour * this.baseRatios.sugar;
        const yeast = flour * this.baseRatios.yeast;
        const eggs = Math.ceil(flour / 300); // 每300g面粉配1个鸡蛋
        
        // 计算液体用量
        const totalLiquidNeed = flour * this.baseRatios.liquid;
        const isWater = this.liquidType.value === 'water';
        const liquid = isWater ? totalLiquidNeed : totalLiquidNeed / this.waterContentRatios.milk;

        // 收集勾选的湿料
        let wetIngredientsUsed = [];
        let totalWaterFromWet = 0;
        this.wetIngredients.forEach(checkbox => {
            if (checkbox.checked) {
                const recommendAmount = Math.round(flour * this.recommendRatios[checkbox.value]);
                const waterRatio = this.waterContentRatios[checkbox.value];
                const waterContent = recommendAmount * waterRatio;
                totalWaterFromWet += waterContent;
                
                wetIngredientsUsed.push({
                    name: checkbox.parentElement.textContent.trim(),
                    amount: recommendAmount,
                    unit: 'g'
                });
            }
        });

        // 收集勾选的粉料
        let dryIngredientsUsed = [];
        this.dryIngredients.forEach(checkbox => {
            if (checkbox.checked) {
                const recommendAmount = Math.round(flour * this.recommendRatios[checkbox.value]);
                dryIngredientsUsed.push({
                    name: checkbox.parentElement.textContent.trim(),
                    amount: recommendAmount,
                    unit: 'g'
                });
            }
        });

        // 收集勾选的馅料
        let fillingsUsed = [];
        this.fillingIngredients.forEach(checkbox => {
            if (checkbox.checked) {
                const recommendAmount = Math.round(flour * this.recommendRatios[checkbox.value]);
                fillingsUsed.push({
                    name: checkbox.parentElement.textContent.trim(),
                    amount: recommendAmount,
                    unit: 'g'
                });
            }
        });

        // 调整液体用量
        const adjustedLiquid = Math.max(0, liquid - totalWaterFromWet);

        this.updateResults({
            flour,
            salt,
            sugar,
            yeast,
            eggs,
            liquid: adjustedLiquid,
            isWater,
            wetIngredients: wetIngredientsUsed,
            dryIngredients: dryIngredientsUsed,
            fillings: fillingsUsed
        });
    }

    updateResults(results) {
        let recipeHtml = `
            <div class="result-item section-title">基础配料：</div>
            <div class="result-item">高筋面粉: ${results.flour}g</div>
            <div class="result-item">鸡蛋: ${results.eggs}个</div>
            <div class="result-item">${results.isWater ? '清水' : '牛奶'}: ${results.liquid.toFixed(1)}${results.isWater ? 'g' : 'ml'}</div>
            <div class="result-item">盐: ${results.salt.toFixed(1)}g</div>
            <div class="result-item">糖: ${results.sugar.toFixed(1)}g</div>
            <div class="result-item">耐高糖酵母: ${results.yeast.toFixed(1)}g</div>
        `;

        if (results.wetIngredients.length > 0) {
            recipeHtml += '<div class="result-item section-title">湿料：</div>';
            results.wetIngredients.forEach(ing => {
                recipeHtml += `<div class="result-item">- ${ing.name}: ${ing.amount}${ing.unit}</div>`;
            });
        }

        if (results.dryIngredients.length > 0) {
            recipeHtml += '<div class="result-item section-title">粉料：</div>';
            results.dryIngredients.forEach(ing => {
                recipeHtml += `<div class="result-item">- ${ing.name}: ${ing.amount}${ing.unit}</div>`;
            });
        }

        if (results.fillings.length > 0) {
            recipeHtml += '<div class="result-item section-title">馅料：</div>';
            results.fillings.forEach(ing => {
                recipeHtml += `<div class="result-item">- ${ing.name}: ${ing.amount}${ing.unit}</div>`;
            });
        }

        this.recipeList.innerHTML = recipeHtml;
    }

    initializeStorage() {
        if (!localStorage.getItem('savedRecipes')) {
            localStorage.setItem('savedRecipes', JSON.stringify([]));
        }
    }

    saveRecipe() {
        // 先计算当前配方
        this.calculate();
        
        const recipeName = prompt('请输入配方名称：');
        if (!recipeName) return;

        const flour = parseFloat(this.flourInput.value);
        const isWater = this.liquidType.value === 'water';
        
        // 计算液体用量
        const totalLiquidNeed = flour * this.baseRatios.liquid;
        const liquid = isWater ? totalLiquidNeed : totalLiquidNeed / this.waterContentRatios.milk;
        
        // 计算其他湿料的水分贡献
        let totalWaterFromWet = 0;
        const wetIngredientsUsed = Array.from(this.wetIngredients)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => {
                const recommendAmount = Math.round(flour * this.recommendRatios[checkbox.value]);
                const waterRatio = this.waterContentRatios[checkbox.value];
                totalWaterFromWet += recommendAmount * waterRatio;
                return {
                    name: checkbox.parentElement.textContent.trim(),
                    type: checkbox.value,
                    amount: recommendAmount
                };
            });

        // 调整液体用量
        const adjustedLiquid = Math.max(0, liquid - totalWaterFromWet);

        const currentRecipe = {
            id: Date.now(),
            name: recipeName,
            date: new Date().toISOString(),
            flour: flour,
            eggs: Math.ceil(flour / 300),
            liquidType: this.liquidType.value,
            liquid: adjustedLiquid,  // 使用调整后的液体用量
            salt: flour * this.baseRatios.salt,
            sugar: flour * this.baseRatios.sugar,
            yeast: flour * this.baseRatios.yeast,
            wetIngredients: wetIngredientsUsed,
            dryIngredients: Array.from(this.dryIngredients)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => ({
                    name: checkbox.parentElement.textContent.trim(),
                    type: checkbox.value,
                    amount: Math.round(flour * this.recommendRatios[checkbox.value])
                })),
            fillings: Array.from(this.fillingIngredients)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => ({
                    name: checkbox.parentElement.textContent.trim(),
                    type: checkbox.value,
                    amount: Math.round(flour * this.recommendRatios[checkbox.value])
                }))
        };

        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes'));
        savedRecipes.push(currentRecipe);
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        
        this.loadSavedRecipes();
        alert('配方保存成功！');
    }

    loadSavedRecipes() {
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
        const container = document.getElementById('saved-recipes');
        
        if (savedRecipes.length === 0) {
            container.innerHTML = '<div class="recipe-card">暂无保存的配方</div>';
            return;
        }
        
        container.innerHTML = savedRecipes.map(recipe => {
            let recipeHtml = `
                <div class="recipe-card">
                    <h4>${recipe.name || '未命名配方'}</h4>
                    <div class="date">保存时间：${new Date(recipe.date).toLocaleString()}</div>
                    <div class="ingredients-section">
                        <strong>基础配料：</strong>
                        <div>高筋面粉: ${recipe.flour}g</div>
                        <div>鸡蛋: ${recipe.eggs}个</div>
                        <div>${recipe.liquidType === 'water' ? '清水' : '牛奶'}: ${recipe.liquid ? recipe.liquid.toFixed(1) : '0'}${recipe.liquidType === 'water' ? 'g' : 'ml'}</div>
                        <div>盐: ${recipe.salt ? recipe.salt.toFixed(1) : (recipe.flour * 0.02).toFixed(1)}g</div>
                        <div>糖: ${recipe.sugar ? recipe.sugar.toFixed(1) : (recipe.flour * 0.1).toFixed(1)}g</div>
                        <div>耐高糖酵母: ${recipe.yeast ? recipe.yeast.toFixed(1) : (recipe.flour * 0.01).toFixed(1)}g</div>
                    </div>
            `;

            if (recipe.wetIngredients?.length > 0) {
                recipeHtml += '<div class="ingredients-section"><strong>湿料：</strong>';
                recipe.wetIngredients.forEach(ing => {
                    recipeHtml += `<div>${ing.name}: ${ing.amount || Math.round(recipe.flour * this.recommendRatios[ing.type])}g</div>`;
                });
                recipeHtml += '</div>';
            }

            if (recipe.dryIngredients?.length > 0) {
                recipeHtml += '<div class="ingredients-section"><strong>粉料：</strong>';
                recipe.dryIngredients.forEach(ing => {
                    recipeHtml += `<div>${ing.name}: ${ing.amount || Math.round(recipe.flour * this.recommendRatios[ing.type])}g</div>`;
                });
                recipeHtml += '</div>';
            }

            if (recipe.fillings?.length > 0) {
                recipeHtml += '<div class="ingredients-section"><strong>馅料：</strong>';
                recipe.fillings.forEach(ing => {
                    recipeHtml += `<div>${ing.name}: ${ing.amount || Math.round(recipe.flour * this.recommendRatios[ing.type])}g</div>`;
                });
                recipeHtml += '</div>';
            }

            recipeHtml += `
                    <div class="actions">
                        <button onclick="calculator.loadRecipe(${recipe.id})">加载</button>
                        <button onclick="calculator.deleteRecipe(${recipe.id})">删除</button>
                    </div>
                </div>
            `;
            return recipeHtml;
        }).join('');
    }

    loadRecipe(id) {
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes'));
        const recipe = savedRecipes.find(r => r.id === id);
        if (!recipe) return;

        this.flourInput.value = recipe.flour;
        this.liquidType.value = recipe.liquidType;
        
        this.wetIngredients.forEach(checkbox => checkbox.checked = false);
        this.dryIngredients.forEach(checkbox => checkbox.checked = false);
        this.fillingIngredients.forEach(checkbox => checkbox.checked = false);

        recipe.wetIngredients?.forEach(saved => {
            const checkbox = Array.from(this.wetIngredients)
                .find(cb => cb.value === saved.type);
            if (checkbox) checkbox.checked = true;
        });

        recipe.dryIngredients?.forEach(saved => {
            const checkbox = Array.from(this.dryIngredients)
                .find(cb => cb.value === saved.type);
            if (checkbox) checkbox.checked = true;
        });

        recipe.fillings?.forEach(saved => {
            const checkbox = Array.from(this.fillingIngredients)
                .find(cb => cb.value === saved.type);
            if (checkbox) checkbox.checked = true;
        });

        this.calculate();
        this.historyModal.style.display = 'none';
    }

    deleteRecipe(id) {
        if (!confirm('确定要删除这个配方吗？')) return;

        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes'));
        const updatedRecipes = savedRecipes.filter(r => r.id !== id);
        localStorage.setItem('savedRecipes', JSON.stringify(updatedRecipes));
        
        this.loadSavedRecipes();
    }
}

let calculator;

document.addEventListener('DOMContentLoaded', () => {
    calculator = new BreadCalculator();
});

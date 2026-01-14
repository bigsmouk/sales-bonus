function calculateSimpleRevenue(purchase, _product) {
    // Расчет выручки с учетом скидки
    const discountMultiplier = 1 - (purchase.discount / 100);
    const revenue = purchase.sale_price * purchase.quantity * discountMultiplier;
    return revenue;
}

function calculateBonusByProfit(index, total, seller) {
    // Получаем прибыль продавца
    const profit = seller.profit;
    
    // Проверяем позицию в рейтинге и рассчитываем бонус
    if (index === 0) {
        // Первое место - 15%
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        // Второе и третье место - 10%
        return profit * 0.10;
    } else if (index === total - 1) {
        // Последнее место - 0%
        return 0;
    } else {
        // Все остальные - 5%
        return profit * 0.05;
    }
}

function analyzeSalesData(data, options) {
    // Проверка входных данных
    if (!data || 
        !Array.isArray(data.sellers) || data.sellers.length === 0 ||
        !Array.isArray(data.products) || data.products.length === 0 ||
        !Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные');
    }
    
    // Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options;
    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Не переданы необходимые функции для расчетов');
    }
    
    // Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));
    
    // Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = {};
    sellerStats.forEach(seller => {
        sellerIndex[seller.id] = seller;
    });
    
    const productIndex = {};
    data.products.forEach(product => {
        productIndex[product.sku] = product;
    });
    
    // Расчёт выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        
        // Увеличиваем количество продаж
        seller.sales_count += 1;
        
        // Добавляем общую выручку по чеку
        seller.revenue += record.total_amount;
        
        // Обрабатываем каждый товар в чеке
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            
            // Себестоимость товара
            const cost = product.purchase_price * item.quantity;
            
            // Выручка от этого товара (с учетом скидки)
            const revenue = calculateRevenue(item, product);
            
            // Прибыль от этого товара
            const profit = revenue - cost;
            
            // Добавляем к общей прибыли продавца
            seller.profit += profit;
            
            // Учет проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });
    
    // Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
    
    // Назначение премий на основе ранжирования
    const totalSellers = sellerStats.length;
    sellerStats.forEach((seller, index) => {
        // Расчет бонуса
        seller.bonus = calculateBonus(index, totalSellers, seller);
        
        // Формирование топ-10 товаров
        const topProducts = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        
        seller.top_products = topProducts;
    });
    
    // Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}

// Экспорт для Node.js тестов
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateSimpleRevenue,
        calculateBonusByProfit,
        analyzeSalesData
    };
}

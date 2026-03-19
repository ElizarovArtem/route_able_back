export enum ClientCoachTransactionType {
  /**
   * Начисление тренировок после успешной оплаты заказа
   * Пример: купили пакет на 8 → +8
   */
  PURCHASE_CREDIT = 'PURCHASE_CREDIT',

  /**
   * Списание одной тренировки после подтверждённого занятия
   * (CONFIRMED_BY_CLIENT или AUTO_CONFIRMED)
   * Пример: -1
   */
  SESSION_DEBIT = 'SESSION_DEBIT',

  /**
   * Возврат тренировки (отмена, no-show, спор)
   * Пример: +1
   */
  SESSION_RETURN = 'SESSION_RETURN',

  /**
   * Ручная корректировка админом (любое изменение баланса)
   * Пример: +2 или -3
   */
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',

  /**
   * Списание тренировок при возврате денег клиенту
   * (например, возврат за неиспользованный пакет)
   */
  REFUND_DEBIT = 'REFUND_DEBIT',
  /**
   * Резервирование слота для тренировки
   */
  SESSION_RESERVE = 'SESSION_RESERVE',
}

export enum CoachOrderStatus {
  /**
   * Заказ создан, но оплата ещё не начата
   */
  CREATED = 'CREATED',

  /**
   * Платёж создан у провайдера, пользователь ещё не оплатил
   */
  PAYMENT_PENDING = 'PAYMENT_PENDING',

  /**
   * Оплата успешно прошла (деньги получены платформой)
   */
  PAID = 'PAID',

  /**
   * Оплата не удалась (ошибка провайдера)
   */
  FAILED = 'FAILED',

  /**
   * Платёж отменён пользователем или системой
   */
  CANCELED = 'CANCELED',

  /**
   * Деньги возвращены клиенту
   */
  REFUNDED = 'REFUNDED',
}

export enum CoachWorkoutSessionStatus {
  /**
   * Сессия забронирована (есть слот и запись)
   */
  BOOKED = 'BOOKED',

  /**
   * Тренер отметил, что занятие проведено
   * (ожидаем подтверждение клиента)
   */
  COMPLETED_BY_COACH = 'COMPLETED_BY_COACH',

  /**
   * Клиент подтвердил занятие
   * → финальный успешный статус
   * → списывается тренировка
   * → создаётся payout тренеру
   */
  CONFIRMED_BY_CLIENT = 'CONFIRMED_BY_CLIENT',

  /**
   * Автоподтверждение системой (если клиент не ответил)
   * → эквивалент CONFIRMED_BY_CLIENT
   */
  AUTO_CONFIRMED = 'AUTO_CONFIRMED',

  /**
   * Клиент отменил занятие
   */
  CANCELLED_BY_CLIENT = 'CANCELLED_BY_CLIENT',

  /**
   * Тренер отменил занятие
   */
  CANCELLED_BY_COACH = 'CANCELLED_BY_COACH',

  /**
   * Клиент не пришёл на занятие
   * (логика списания зависит от бизнес-правил)
   */
  NO_SHOW_CLIENT = 'NO_SHOW_CLIENT',

  /**
   * Тренер не пришёл на занятие
   * (обычно → возврат тренировки)
   */
  NO_SHOW_COACH = 'NO_SHOW_COACH',

  /**
   * Открыт спор по занятию
   * → блокирует payout
   */
  DISPUTED = 'DISPUTED',
}

export enum CoachPaymentStatus {
  /**
   * Создана запись в БД, но ещё не отправлена в платёжку
   */
  CREATED = 'CREATED',

  /**
   * Платёж создан у провайдера, ожидаем действия пользователя
   */
  PENDING = 'PENDING',

  /**
   * Деньги успешно получены и удерживаются платформой (escrow)
   * → важно для ORDER_PAYMENT
   */
  HOLD = 'HOLD',

  /**
   * Выплата тренеру готова (сессия подтверждена)
   */
  READY_FOR_PAYOUT = 'READY_FOR_PAYOUT',

  /**
   * Выплата тренеру отправлена в платёжную систему
   */
  PAYOUT_PENDING = 'PAYOUT_PENDING',

  /**
   * Операция успешно завершена
   * (чаще используется для payout)
   */
  SUCCEEDED = 'SUCCEEDED',

  /**
   * Операция не удалась
   */
  FAILED = 'FAILED',

  /**
   * Операция отменена
   */
  CANCELED = 'CANCELED',

  /**
   * Начат процесс возврата денег клиенту
   */
  REFUND_PENDING = 'REFUND_PENDING',

  /**
   * Деньги успешно возвращены клиенту
   */
  REFUNDED = 'REFUNDED',

  /**
   * Операция находится в споре
   * → блокирует payout
   */
  DISPUTED = 'DISPUTED',
}

export enum CoachPaymentType {
  /**
   * Платёж клиента за заказ (входящие деньги)
   */
  ORDER_PAYMENT = 'ORDER_PAYMENT',

  /**
   * Выплата тренеру (после подтверждённой сессии)
   */
  COACH_PAYOUT = 'COACH_PAYOUT',

  /**
   * Возврат денег клиенту
   */
  CLIENT_REFUND = 'CLIENT_REFUND',
}

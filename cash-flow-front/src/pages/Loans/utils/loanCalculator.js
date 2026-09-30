export const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const timeDiff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
};

export const calculateLoanDetails = (form, clients, defaultInterestRate) => {
  const amount = parseInt(form.amount, 10) || 0;
  const baseInterestRate = parseInt(form.interestRate, 10) || parseInt(defaultInterestRate, 10) || 20;
  const installments = parseInt(form.installments, 10) || 1;
  const frequency = form.frequency;
  const paymentMethod = form.paymentMethod;
  const currentDaysDiff = getDaysBetween(new Date(), form.dueDate);

  let finalInterestRate = baseInterestRate;
  let interestAmount = 0;
  let totalToPay = 0;
  const schedule = [];

  // CASO 1: CUOTA ÚNICA O A TÉRMINO
  if (installments === 1 || frequency === "A_TERMINO") {
    const diasMesBase = 30;

    if (currentDaysDiff <= diasMesBase) {
      const dailyRate = baseInterestRate / diasMesBase;
      finalInterestRate = Math.round(dailyRate * Math.max(1, currentDaysDiff) * 100) / 100;
      interestAmount = Math.round(amount * (finalInterestRate / 100));
    } else {
      const diasExtras = currentDaysDiff - diasMesBase;
      const interesPrimerMes = amount * (baseInterestRate / 100);
      
      let interesRemanente = 0;

      // CORRECCIÓN EXACTA PARA EL REMANENTE:
      // Si es "personalizado", tomamos la tasa que eligió el usuario para el remanente. 
      // Si es "proporcional", usamos la tasa base mensual.
      // En ambos casos, se divide por 30 y se multiplica por los días extras exactos.
      const tasaARecalcular = form.remainderType === "personalizado" 
        ? (parseInt(form.remainderRate, 10) || baseInterestRate)
        : baseInterestRate;

      const tasaDiariaRemanente = tasaARecalcular / diasMesBase;
      const tasaRemanenteEfectiva = tasaDiariaRemanente * diasExtras;
      interesRemanente = amount * (tasaRemanenteEfectiva / 100);

      interestAmount = Math.round(interesPrimerMes + interesRemanente);
      finalInterestRate = Math.round((interestAmount / amount) * 100);
    }

    totalToPay = amount + interestAmount;

    schedule.push({
      installmentNumber: 1,
      dueDate: form.dueDate,
      capital: amount,
      interest: interestAmount,
      amount: totalToPay
    });

  } else {
    // CASO 2: MÚLTIPLES CUOTAS
    const installmentCapital = Math.round(amount / installments);
    let accumulatedInterest = 0;
    let baseDateObj = new Date(form.dueDate);

    for (let i = 1; i <= installments; i++) {
      let instDate = new Date(baseDateObj);
      
      if (frequency === "MENSUAL") {
        instDate.setMonth(baseDateObj.getMonth() + (i - 1));
      } else if (frequency === "QUINCENAL") {
        instDate.setDate(baseDateObj.getDate() + (15 * (i - 1)));
      } else if (frequency === "SEMANAL") {
        instDate.setDate(baseDateObj.getDate() + (7 * (i - 1)));
      } else if (frequency === "DIARIO") {
        instDate.setDate(baseDateObj.getDate() + (i - 1));
      }

      let instInterest = 0;

      if (i === 1) {
        if (form.multiInstallmentCalc === "plena") {
          instInterest = Math.round(amount * (baseInterestRate / 100));
        } else {
          const dailyRate = baseInterestRate / 30;
          const tasaPrecisa = dailyRate * currentDaysDiff;
          instInterest = Math.round(amount * (tasaPrecisa / 100));
        }
      } else {
        if (form.subsequentCalcType === "plena") {
          instInterest = Math.round(amount * (baseInterestRate / 100));
        } else if (form.subsequentCalcType === "proporcional_intervalo") {
          const prevInstDate = schedule[i - 2].dueDate;
          const daysBetweenInsts = getDaysBetween(prevInstDate, instDate.toISOString().split('T')[0]);
          const dailyRate = baseInterestRate / 30;
          const tasaIntervalo = dailyRate * daysBetweenInsts;
          instInterest = Math.round(amount * (tasaIntervalo / 100));
        } else {
          const customSubRate = parseInt(form.subsequentRate, 10) || baseInterestRate;
          instInterest = Math.round(amount * (customSubRate / 100));
        }
      }

      accumulatedInterest += instInterest;

      schedule.push({
        installmentNumber: i,
        dueDate: instDate.toISOString().split('T')[0],
        capital: installmentCapital,
        interest: instInterest,
        amount: installmentCapital + instInterest
      });
    }

    interestAmount = accumulatedInterest;
    totalToPay = amount + interestAmount;
    finalInterestRate = Math.round((interestAmount / amount) * 100);
  }

  const selectedClient = clients.find((c) => String(c.id) === String(form.clientId));

  return {
    client: selectedClient,
    clientId: form.clientId,
    amount,
    interestRate: finalInterestRate,
    installments,
    frequency,
    paymentMethod,
    dueDate: form.dueDate,
    daysDiff: currentDaysDiff,
    interestAmount,
    totalToPay,
    installmentAmount: Math.round(totalToPay / installments),
    schedule,
  };
};
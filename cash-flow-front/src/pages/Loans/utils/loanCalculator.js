export const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const timeDiff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
};

// Función auxiliar para mover la fecha al lunes si cae domingo
const adjustForSunday = (dateObj) => {
  if (dateObj.getDay() === 0) {
    dateObj.setDate(dateObj.getDate() + 1);
  }
  return dateObj;
};

export const calculateLoanDetails = (form, clients, defaultInterestRate) => {
  const amount = parseFloat(form.amount) || 0;
  
  // Usamos parseFloat en lugar de parseInt para no perder los decimales de la tasa (ej: 31.25)
  const baseInterestRate = parseFloat(form.interestRate) || parseFloat(defaultInterestRate) || 20;
  
  const installments = parseInt(form.installments, 10) || 1;
  const frequency = form.frequency;
  const paymentMethod = form.paymentMethod;
  const currentDaysDiff = getDaysBetween(new Date(), form.dueDate);

  let finalInterestRate = baseInterestRate;
  let interestAmount = 0;
  let totalToPay = 0;
  const schedule = [];

  const diasMesBase = 30;

  // =========================================================================
  // LÓGICA GLOBAL PARA FRECUENCIAS DIARIA, SEMANAL Y QUINCENAL
  // =========================================================================
  if ((frequency === "DIARIO" || frequency === "SEMANAL" || frequency === "QUINCENAL") && installments > 1) {
    let daysPerInstallment = 1;
    if (frequency === "SEMANAL") daysPerInstallment = 7;
    if (frequency === "QUINCENAL") daysPerInstallment = 15;

    const totalDays = installments * daysPerInstallment;

    if (totalDays <= diasMesBase) {
      const dailyRate = baseInterestRate / diasMesBase;
      finalInterestRate = Math.round(dailyRate * Math.max(1, totalDays) * 10000) / 10000; // Preservamos mejor precisión
      interestAmount = Math.round(amount * (finalInterestRate / 100));
    } else {
      const diasExtras = totalDays - diasMesBase;
      const interesPrimerMes = amount * (baseInterestRate / 100);
      
      const tasaARecalcular = form.remainderType === "personalizado" 
        ? (parseFloat(form.remainderRate) || baseInterestRate)
        : baseInterestRate;

      const tasaDiariaRemanente = tasaARecalcular / diasMesBase;
      const tasaRemanenteEfectiva = tasaDiariaRemanente * diasExtras;
      const interesRemanente = amount * (tasaRemanenteEfectiva / 100);

      interestAmount = Math.round(interesPrimerMes + interesRemanente);
      
      // Calculamos la tasa final equivalente con 2 decimales para evitar redondeos bruscos
      finalInterestRate = Number(((interestAmount / amount) * 100).toFixed(2));
    }

    totalToPay = amount + interestAmount;
    
    const installmentCapital = amount / installments;
    const installmentInterest = interestAmount / installments;
    const installmentTotal = totalToPay / installments;

    let baseDateObj = new Date(form.dueDate);

    for (let i = 1; i <= installments; i++) {
      let instDate = new Date(baseDateObj);
      
      if (frequency === "DIARIO") {
        let addedDays = 0;
        while (addedDays < (i - 1)) {
          instDate.setDate(instDate.getDate() + 1);
          if (instDate.getDay() === 0) {
            instDate.setDate(instDate.getDate() + 1); // Saltea domingos
          }
          addedDays++;
        }
      } else if (frequency === "SEMANAL") {
        instDate.setDate(baseDateObj.getDate() + (7 * (i - 1)));
      } else if (frequency === "QUINCENAL") {
        instDate.setDate(baseDateObj.getDate() + (15 * (i - 1)));
      }

      adjustForSunday(instDate);

      schedule.push({
        installmentNumber: i,
        dueDate: instDate.toISOString().split('T')[0],
        capital: Math.round(installmentCapital),
        interest: Math.round(installmentInterest),
        amount: Math.round(installmentTotal)
      });
    }

  } else if (installments === 1 || frequency === "A_TERMINO") {
    // ==========================================
    // CASO 1: CUOTA ÚNICA O A TÉRMINO (Con tasa mensual fija + proporcional excedente)
    // ==========================================
    if (currentDaysDiff <= diasMesBase) {
      finalInterestRate = baseInterestRate;
      interestAmount = Math.round(amount * (baseInterestRate / 100));
    } else {
      const diasExtras = currentDaysDiff - diasMesBase;
      const interesPrimerMes = amount * (baseInterestRate / 100);
      
      const tasaARecalcular = form.remainderType === "personalizado" 
        ? (parseFloat(form.remainderRate) || baseInterestRate)
        : baseInterestRate;

      const tasaDiariaRemanente = tasaARecalcular / diasMesBase;
      const tasaRemanenteEfectiva = tasaDiariaRemanente * diasExtras;
      const interesRemanente = amount * (tasaRemanenteEfectiva / 100);

      interestAmount = Math.round(interesPrimerMes + interesRemanente);
      
      // Mantenemos decimales en la tasa final para que coincida con lo que el usuario espera
      finalInterestRate = Number(((interestAmount / amount) * 100).toFixed(2));
    }

    totalToPay = amount + interestAmount;

    let finalDueDate = new Date(form.dueDate);
    adjustForSunday(finalDueDate);

    schedule.push({
      installmentNumber: 1,
      dueDate: finalDueDate.toISOString().split('T')[0],
      capital: amount,
      interest: interestAmount,
      amount: totalToPay
    });

  } else {
    // ==========================================
    // CASO 2: MÚLTIPLES CUOTAS (MENSUAL)
    // ==========================================
    const installmentCapital = Math.round(amount / installments);
    let accumulatedInterest = 0;
    let baseDateObj = new Date(form.dueDate);

    for (let i = 1; i <= installments; i++) {
      let instDate = new Date(baseDateObj);
      
      if (frequency === "MENSUAL") {
        instDate.setMonth(baseDateObj.getMonth() + (i - 1));
      }

      adjustForSunday(instDate);

      let instInterest = 0;

      if (i === 1) {
        if (form.multiInstallmentCalc === "plena") {
          instInterest = Math.round(amount * (baseInterestRate / 100));
        } else {
          const dailyRate = baseInterestRate / diasMesBase;
          const tasaPrecisa = dailyRate * currentDaysDiff;
          instInterest = Math.round(amount * (tasaPrecisa / 100));
        }
      } else {
        if (form.subsequentCalcType === "plena") {
          instInterest = Math.round(amount * (baseInterestRate / 100));
        } else if (form.subsequentCalcType === "proporcional_intervalo") {
          const prevInstDate = schedule[i - 2].dueDate;
          const daysBetweenInsts = getDaysBetween(prevInstDate, instDate.toISOString().split('T')[0]);
          const dailyRate = baseInterestRate / diasMesBase;
          const tasaIntervalo = dailyRate * daysBetweenInsts;
          instInterest = Math.round(amount * (tasaIntervalo / 100));
        } else {
          const customSubRate = parseFloat(form.subsequentRate) || baseInterestRate;
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
    finalInterestRate = Number(((interestAmount / amount) * 100).toFixed(2));
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
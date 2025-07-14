import mongoose from "mongoose";

userSchema.methods.addSubject = function (subjectData) {
    // Verificar si la materia ya existe
    const existingSubject = this.subjects.find(
      (subject) => subject.code === subjectData.code.toUpperCase()
    );
  
    if (existingSubject) {
      throw new Error(`La materia con código ${subjectData.code} ya existe`);
    }
  
    this.subjects.push(subjectData);
    return this.save();
  };
  
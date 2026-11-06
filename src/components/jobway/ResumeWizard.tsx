'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  User, Briefcase, Check, ChevronLeft, ChevronRight, Upload, FileText,
  Award, Heart, Target, ArrowRight, Sparkles, Shield, GraduationCap,
  Users, Zap, Globe, Clock, ShoppingCart, Laptop, Palette, MoreHorizontal,
} from 'lucide-react';
import { SKILLS_LIST, EDUCATION_LEVELS, INTEREST_CATEGORIES } from '@/lib/types';
import { toast } from 'sonner';

const STEP_LABELS = ['المعلومات الشخصية', 'المهارات', 'تفضيلات العمل', 'الميول المهنية', 'الاستعدادات'];

export default function ResumeWizard() {
  const { user, navigate } = useAppStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [existingResume, setExistingResume] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [education, setEducation] = useState('');
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [workStyle, setWorkStyle] = useState('individual');
  const [preference, setPreference] = useState('stability');
  const [pressureTolerance, setPressureTolerance] = useState('medium');
  const [workSystem, setWorkSystem] = useState('fulltime');
  const [professionalInterest, setProfessionalInterest] = useState('other');
  const [acceptTraining, setAcceptTraining] = useState(false);
  const [acceptTemporary, setAcceptTemporary] = useState(false);
  const [acceptFieldWork, setAcceptFieldWork] = useState(false);
  const [resumeFile, setResumeFile] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (!user) return;
    fetch(`/api/resume?userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.resume) {
          const r = data.resume;
          setExistingResume(r);
          setFullName(r.fullName || '');
          setAge(String(r.age || ''));
          setEducation(r.education || '');
          setCurrentlyWorking(r.currentlyWorking || false);
          setSkills(typeof r.skills === 'string' ? JSON.parse(r.skills) : (r.skills || []));
          setWorkStyle(r.workStyle || 'individual');
          setPreference(r.preference || 'stability');
          setPressureTolerance(r.pressureTolerance || 'medium');
          setWorkSystem(r.workSystem || 'fulltime');
          setProfessionalInterest(r.professionalInterest || 'other');
          setAcceptTraining(r.acceptTraining || false);
          setAcceptTemporary(r.acceptTemporary || false);
          setAcceptFieldWork(r.acceptFieldWork || false);
          setResumeFile(r.resumeFile || '');
        }
      })
      .catch(() => {});
  }, [user]);

  const progress = ((step + 1) / 5) * 100;

  const toggleSkill = (skill: string) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setResumeFile(data.url);
        setFileName(file.name);
        toast.success('تم رفع الملف بنجاح');
      } else {
        toast.error('فشل رفع الملف');
      }
    } catch { toast.error('حدث خطأ أثناء الرفع'); }
  };

  const validate = (): boolean => {
    if (step === 0) {
      if (!fullName.trim()) { toast.error('يرجى إدخال الاسم الكامل'); return false; }
      if (!age || parseInt(age) < 16 || parseInt(age) > 80) { toast.error('يرجى إدخال عمر صحيح (16-80)'); return false; }
      if (!education) { toast.error('يرجى اختيار المستوى التعليمي'); return false; }
    }
    if (step === 1 && skills.length === 0) { toast.error('يرجى اختيار مهارة واحدة على الأقل'); return false; }
    return true;
  };

  const nextStep = () => {
    if (!validate()) return;
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => { if (step > 0) setStep(step - 1); };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, fullName, age: parseInt(age), education, currentlyWorking,
          skills, workStyle, preference, pressureTolerance, workSystem,
          professionalInterest, acceptTraining, acceptTemporary, acceptFieldWork,
          resumeFile: resumeFile || undefined,
        }),
      });
      if (res.ok) {
        toast.success(existingResume ? 'تم تحديث السيرة الذاتية بنجاح' : 'تم إنشاء السيرة الذاتية بنجاح');
        navigate('seeker-dashboard');
      } else {
        toast.error('فشل حفظ السيرة الذاتية');
      }
    } catch { toast.error('حدث خطأ'); }
    finally { setLoading(false); }
  };

  const OptionCard = ({ selected, onClick, icon: Icon, label, sublabel }: { selected: boolean; onClick: () => void; icon: React.ElementType; label: string; sublabel?: string }) => (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer text-right ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-300'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={`font-semibold text-sm ${selected ? 'text-emerald-700' : 'text-gray-700'}`}>{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
      {selected && <Check className="w-5 h-5 text-emerald-600 mr-auto" />}
    </button>
  );

  function getCatIcon(id: string) {
    const icons: Record<string, React.ElementType> = {
      GraduationCap, ShoppingCart, Heart, Users, Briefcase, Laptop, Palette, MoreHorizontal,
    };
    const cat = INTEREST_CATEGORIES.find(c => c.id === id);
    if (!cat) return Briefcase;
    return icons[cat.icon] || Briefcase;
  }

  return (
    <div dir="rtl" className="page-transition min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 w-full flex-1">
        {/* Back */}
        <Button variant="ghost" className="mb-4 text-gray-500" onClick={() => navigate('seeker-dashboard')}>
          <ChevronLeft className="w-4 h-4 ml-1" /> العودة
        </Button>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إنشاء السيرة الذاتية</h1>
          </div>
          <p className="text-gray-500 text-sm">أكمل الخطوات التالية لإنشاء سيرتك الذاتية تلقائياً</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < step ? 'step-completed' : i === step ? 'step-active' : 'step-pending'}`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < 4 && <div className={`w-6 sm:w-12 h-0.5 mx-1 ${i < step ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="hidden sm:flex justify-between text-xs text-gray-500 mb-2">
            {STEP_LABELS.map((label, i) => (
              <span key={i} className={i === step ? 'text-emerald-600 font-semibold' : ''}>{label}</span>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{STEP_LABELS[step]}</CardTitle>
            <CardDescription>
              {step === 0 && 'أدخل معلوماتك الشخصية الأساسية'}
              {step === 1 && 'اختر المهارات التي تتقنها'}
              {step === 2 && 'حدد تفضيلاتك في بيئة العمل'}
              {step === 3 && 'اختر المجال الذي تود العمل فيه'}
              {step === 4 && 'حدد استعداداتك النهائية وارفع سيرتك إن وجدت'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Info */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الاسم الكامل <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="أدخل اسمك الكامل" className="pr-10 h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">العمر <span className="text-red-500">*</span></Label>
                  <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="العمر" className="h-11" min={16} max={80} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">المستوى التعليمي <span className="text-red-500">*</span></Label>
                  <Select value={education} onValueChange={setEducation}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
                    <SelectContent>{EDUCATION_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <Checkbox checked={currentlyWorking} onCheckedChange={v => setCurrentlyWorking(!!v)} className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                  <Label className="text-sm cursor-pointer">هل تعمل حالياً؟</Label>
                </div>
              </div>
            )}

            {/* Step 2: Skills */}
            {step === 1 && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_LIST.map(skill => (
                    <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-full text-sm border-2 transition-all cursor-pointer ${skills.includes(skill) ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium' : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'}`}>
                      {skills.includes(skill) && <Check className="w-3 h-3 ml-1 inline" />}
                      {skill}
                    </button>
                  ))}
                </div>
                {skills.length > 0 && (
                  <p className="text-sm text-emerald-600 mt-4 font-medium">تم اختيار {skills.length} مهارة</p>
                )}
              </div>
            )}

            {/* Step 3: Work Preferences */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">كيف تفضل العمل؟</p>
                  <div className="grid grid-cols-2 gap-3">
                    <OptionCard selected={workStyle === 'individual'} onClick={() => setWorkStyle('individual')} icon={User} label="العمل الفردي" sublabel="أفضل العمل بمفردي" />
                    <OptionCard selected={workStyle === 'group'} onClick={() => setWorkStyle('group')} icon={Users} label="العمل الجماعي" sublabel="أفضل العمل ضمن فريق" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">ماذا تفضل؟</p>
                  <div className="grid grid-cols-2 gap-3">
                    <OptionCard selected={preference === 'stability'} onClick={() => setPreference('stability')} icon={Shield} label="الاستقرار" sublabel="بيئة عمل مستقرة" />
                    <OptionCard selected={preference === 'challenge'} onClick={() => setPreference('challenge')} icon={Zap} label="التحدي" sublabel="بيئة عمل محفزة" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">العمل تحت الضغط</p>
                  <div className="grid grid-cols-3 gap-3">
                    <OptionCard selected={pressureTolerance === 'strong'} onClick={() => setPressureTolerance('strong')} icon={Award} label="أتحمل" />
                    <OptionCard selected={pressureTolerance === 'medium'} onClick={() => setPressureTolerance('medium')} icon={Target} label="متوسط" />
                    <OptionCard selected={pressureTolerance === 'weak'} onClick={() => setPressureTolerance('weak')} icon={Heart} label="ضعيف" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">نظام العمل المفضل</p>
                  <div className="grid grid-cols-3 gap-3">
                    <OptionCard selected={workSystem === 'fulltime'} onClick={() => setWorkSystem('fulltime')} icon={Briefcase} label="دوام كامل" />
                    <OptionCard selected={workSystem === 'parttime'} onClick={() => setWorkSystem('parttime')} icon={Clock} label="دوام جزئي" />
                    <OptionCard selected={workSystem === 'remote'} onClick={() => setWorkSystem('remote')} icon={Globe} label="عن بعد" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Professional Interest */}
            {step === 3 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {INTEREST_CATEGORIES.map(cat => {
                  const Icon = getCatIcon(cat.id);
                  return (
                    <button key={cat.id} type="button" onClick={() => setProfessionalInterest(cat.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${professionalInterest === cat.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-300'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${professionalInterest === cat.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-sm font-medium ${professionalInterest === cat.id ? 'text-emerald-700' : 'text-gray-600'}`}>{cat.label}</span>
                      {professionalInterest === cat.id && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 5: Readiness + Upload */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">الاستعدادات النهائية</p>
                  {[
                    { label: 'هل تقبل التكوين؟', checked: acceptTraining, onChange: setAcceptTraining },
                    { label: 'هل تقبل العمل المؤقت؟', checked: acceptTemporary, onChange: setAcceptTemporary },
                    { label: 'هل أنت مستعد للعمل خارج المؤسسة؟', checked: acceptFieldWork, onChange: setAcceptFieldWork },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <Checkbox checked={item.checked} onCheckedChange={v => item.onChange(!!v)} className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                      <Label className="text-sm cursor-pointer">{item.label}</Label>
                    </div>
                  ))}
                </div>

                <div className="section-divider" />

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">رفع السيرة الذاتية <span className="text-gray-400 font-normal">(اختياري - PDF)</span></p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                  {resumeFile && fileName ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50">
                      <FileText className="w-8 h-8 text-emerald-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-emerald-700 truncate">{fileName}</p>
                        <p className="text-xs text-emerald-500">تم الرفع بنجاح</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setResumeFile(''); setFileName(''); }}>
                        تغيير
                      </Button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-600">اضغط لرفع السيرة الذاتية</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX - حد أقصى 5 ميجابايت</p>
                    </button>
                  )}
                </div>

                {/* Preview Summary */}
                <div className="section-divider" />
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">ملخص السيرة الذاتية</p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">الاسم</span><span className="font-medium">{fullName || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">العمر</span><span className="font-medium">{age || '—'} سنة</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">المستوى</span><span className="font-medium">{education || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">المهارات</span><span className="font-medium">{skills.length} مهارة</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">العمل</span><span className="font-medium">{workStyle === 'individual' ? 'فردي' : 'جماعي'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">الميول</span><span className="font-medium">{INTEREST_CATEGORIES.find(c => c.id === professionalInterest)?.label || '—'}</span></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={prevStep} disabled={step === 0} className="gap-2">
            <ChevronRight className="w-4 h-4" /> السابق
          </Button>
          {step < 4 ? (
            <Button onClick={nextStep} className="gap-2 bg-emerald-700 hover:bg-emerald-800">
              التالي <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-2 bg-emerald-700 hover:bg-emerald-800 min-w-32">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  جاري الحفظ...
                </span>
              ) : (
                <>حفظ السيرة الذاتية <Check className="w-4 h-4" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

